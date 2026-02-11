/**
 * Seoul City Adapter Implementation
 * 서울특별시 어댑터 구현
 *
 * Implements ICityAdapter for Seoul Metropolitan City.
 * Version: v2 (VWorld API with mock fallback)
 *
 * Data Sources:
 * - Parcel: VWorld API (primary), mock data (fallback)
 * - Zoning: VWorld API (primary), district-based inference (fallback)
 * - Address: Pattern-based parsing
 *
 * API Integration:
 * - VWorld Data API 2.0 for 연속지적도 (cadastral polygons)
 * - VWorld WFS for coordinate-based parcel lookup
 */

import type {
  ICityAdapter,
  CityInfo,
  ResolvedAddressResult,
  ParcelFetchResult,
  ZoningResolutionResult,
  RegulationLookupResult,
  ZoningOverlay,
} from '../../../domain/korea/cityAdapter'

import type {
  KoreaParcel,
  JibunAddress,
  PNU,
} from '../../../domain/korea/parcel'

import {
  buildPNU,
  SEOUL_DISTRICT_CODES,
  formatJibunAddress,
  calculateAreaFromGeometry,
} from '../../../domain/korea/parcel'

import type { ZoningCode } from '../../../domain/korea/zoning'
import { SEOUL_REGULATIONS, getRegulations } from '../../../domain/korea/regulations'

import {
  getVWorldClient,
  isVWorldAvailable,
  getDataGoKrClient,
  isDataGoKrAvailable,
} from '../api'

import type {
  LandUsePermissionResult,
  ZonePermissionsResult,
  LandUseActivityInfo,
} from '../api/dataGoKrClient'

/**
 * Seoul District to typical zoning mapping
 * Based on predominant zoning in each district
 *
 * Note: This is a SIMPLIFICATION. Real parcels vary significantly.
 * Used only when actual zoning data is unavailable.
 */
const DISTRICT_ZONING_MAP: Record<string, ZoningCode> = {
  // High-density commercial/residential
  강남구: 'R3G',
  서초구: 'R3G',
  송파구: 'R2G',
  강동구: 'R2G',

  // Mixed commercial
  마포구: 'RSR',
  영등포구: 'CG',
  종로구: 'CG',
  중구: 'CC',

  // Residential dominant
  용산구: 'R2G',
  성동구: 'ISI', // 준공업 areas like 성수
  광진구: 'R2G',
  동대문구: 'R2G',
  중랑구: 'R2G',
  성북구: 'R1G',
  강북구: 'R1G',
  도봉구: 'R1G',
  노원구: 'R2G',
  은평구: 'R1G',
  서대문구: 'R2G',
  양천구: 'R2G',
  강서구: 'R2G',
  동작구: 'R2G',
  관악구: 'R2G',

  // Industrial/mixed
  구로구: 'ISI',
  금천구: 'ISI',
}

/**
 * Seoul district center coordinates
 * Used for approximate geocoding when exact address not resolved
 */
const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  종로구: [126.979, 37.5735],
  중구: [126.998, 37.5641],
  용산구: [126.99, 37.5326],
  성동구: [127.037, 37.5634],
  광진구: [127.082, 37.5385],
  동대문구: [127.04, 37.5743],
  중랑구: [127.093, 37.6066],
  성북구: [127.017, 37.5894],
  강북구: [127.011, 37.6398],
  도봉구: [127.047, 37.6688],
  노원구: [127.056, 37.6543],
  은평구: [126.929, 37.6027],
  서대문구: [126.937, 37.5791],
  마포구: [126.901, 37.5663],
  양천구: [126.866, 37.5169],
  강서구: [126.85, 37.5509],
  구로구: [126.888, 37.4955],
  금천구: [126.896, 37.4566],
  영등포구: [126.896, 37.5264],
  동작구: [126.939, 37.5124],
  관악구: [126.952, 37.4784],
  서초구: [127.033, 37.4837],
  강남구: [127.047, 37.5172],
  송파구: [127.106, 37.5146],
  강동구: [127.124, 37.5302],
}

/**
 * Seoul City Adapter
 */
export class SeoulCityAdapter implements ICityAdapter {
  private cityInfo: CityInfo = {
    code: 'SEOUL',
    nameKorean: '서울특별시',
    nameEnglish: 'Seoul Metropolitan City',
    sidoCode: '11',
    population: 9_428_000,
    areaKm2: 605.2,
    districts: Object.keys(SEOUL_DISTRICT_CODES),
  }

  getCityInfo(): CityInfo {
    return this.cityInfo
  }

  isAddressInCity(address: string): boolean {
    const patterns = [/^서울/, /서울특별시/, /서울시/, /^seoul/i]
    return patterns.some((p) => p.test(address.trim()))
  }

  async resolveAddress(input: string): Promise<ResolvedAddressResult> {
    const trimmed = input.trim()

    // Validate minimum length
    if (trimmed.length < 5) {
      return {
        success: false,
        input,
        confidence: 'failed',
        error: '주소가 너무 짧습니다. 최소 5자 이상 입력하세요.',
      }
    }

    // Check if Seoul address
    if (!this.isAddressInCity(trimmed)) {
      return {
        success: false,
        input,
        confidence: 'failed',
        error: '서울 주소가 아닙니다. 서울특별시 주소를 입력하세요.',
      }
    }

    // Extract district (구)
    const districtMatch = trimmed.match(/([가-힣]+구)/)
    if (!districtMatch) {
      return {
        success: false,
        input,
        confidence: 'failed',
        error: '구(區)를 찾을 수 없습니다. 예: 강남구, 종로구',
      }
    }

    const district = districtMatch[1]
    if (!SEOUL_DISTRICT_CODES[district]) {
      return {
        success: false,
        input,
        confidence: 'failed',
        error: `"${district}"은(는) 서울시 구가 아닙니다.`,
      }
    }

    // Parse dong/road and jibun
    const parsed = this.parseAddressComponents(trimmed, district)

    // Get coordinates (district-level approximation)
    const coordinates = this.getCoordinates(district, parsed.dong)

    return {
      success: true,
      input,
      normalized: this.normalizeAddress(district, parsed),
      jibunAddress: parsed.jibunAddress,
      coordinates,
      confidence: parsed.jibunAddress ? 'approximate' : 'district_level',
    }
  }

  async fetchParcel(
    addressOrCoords: ResolvedAddressResult | [number, number]
  ): Promise<ParcelFetchResult> {
    let coordinates: [number, number]
    let jibunAddress: JibunAddress | undefined

    if (Array.isArray(addressOrCoords)) {
      coordinates = addressOrCoords
    } else {
      if (!addressOrCoords.success || !addressOrCoords.coordinates) {
        return {
          success: false,
          source: 'mock',
          confidence: 'estimated',
          error: '주소를 먼저 확인해주세요.',
        }
      }
      coordinates = addressOrCoords.coordinates
      jibunAddress = addressOrCoords.jibunAddress
    }

    // Try VWorld API first if available
    if (isVWorldAvailable()) {
      const vworldResult = await this.fetchParcelFromVWorld(coordinates, jibunAddress)
      if (vworldResult.success) {
        return vworldResult
      }
      // Log the error but continue to fallback
      console.warn('VWorld API failed, trying data.go.kr:', vworldResult.error)
    }

    // Try data.go.kr API as secondary source
    if (isDataGoKrAvailable() && jibunAddress) {
      const dataGoKrResult = await this.fetchParcelFromDataGoKr(coordinates, jibunAddress)
      if (dataGoKrResult.success) {
        return dataGoKrResult
      }
      console.warn('data.go.kr API failed, falling back to mock data:', dataGoKrResult.error)
    }

    // Fallback to mock parcel (only if APIs not available)
    if (!isVWorldAvailable() && !isDataGoKrAvailable()) {
      const parcel = this.generateMockParcel(coordinates, jibunAddress)
      return {
        success: true,
        parcel,
        source: 'mock',
        confidence: 'estimated',
      }
    }

    // Both APIs available but failed - return error instead of mock
    return {
      success: false,
      source: 'api',
      confidence: 'estimated',
      error: '실제 필지 데이터를 가져오지 못했습니다. 주소를 확인하거나 수동으로 입력해 주세요.',
    }
  }

  /**
   * Fetch parcel from data.go.kr API
   */
  private async fetchParcelFromDataGoKr(
    coordinates: [number, number],
    jibunAddress?: JibunAddress
  ): Promise<ParcelFetchResult> {
    const client = getDataGoKrClient()
    if (!client) {
      return {
        success: false,
        source: 'mock',
        confidence: 'estimated',
        error: 'data.go.kr client not available',
      }
    }

    try {
      // Try coordinate-based lookup
      const result = await client.fetchParcelByCoordinates(coordinates[0], coordinates[1])

      if (result.success && result.parcel) {
        // Merge jibunAddress if provided (more reliable than API parsing)
        if (jibunAddress) {
          result.parcel.jibunAddress = {
            ...result.parcel.jibunAddress,
            ...jibunAddress,
          }
        }

        return {
          success: true,
          parcel: result.parcel,
          source: 'api',
          confidence: 'official',
        }
      }

      return {
        success: false,
        source: 'api',
        confidence: 'estimated',
        error: result.error || 'No parcel found at coordinates',
      }
    } catch (error) {
      return {
        success: false,
        source: 'mock',
        confidence: 'estimated',
        error: error instanceof Error ? error.message : 'data.go.kr API error',
      }
    }
  }

  /**
   * Fetch parcel from VWorld API
   */
  private async fetchParcelFromVWorld(
    coordinates: [number, number],
    jibunAddress?: JibunAddress
  ): Promise<ParcelFetchResult> {
    const client = getVWorldClient()
    if (!client) {
      return {
        success: false,
        source: 'mock',
        confidence: 'estimated',
        error: 'VWorld client not available',
      }
    }

    try {
      // Try coordinate-based lookup
      const result = await client.fetchParcelByCoordinates(coordinates[0], coordinates[1])

      if (result.success && result.parcel) {
        // Merge jibunAddress if provided (more reliable than API parsing)
        if (jibunAddress) {
          result.parcel.jibunAddress = {
            ...result.parcel.jibunAddress,
            ...jibunAddress,
          }
        }

        return {
          success: true,
          parcel: result.parcel,
          source: 'api',
          confidence: 'official',
        }
      }

      return {
        success: false,
        source: 'api',
        confidence: 'estimated',
        error: result.error || 'No parcel found at coordinates',
      }
    } catch (error) {
      return {
        success: false,
        source: 'mock',
        confidence: 'estimated',
        error: error instanceof Error ? error.message : 'VWorld API error',
      }
    }
  }

  async resolveZoning(parcel: KoreaParcel): Promise<ZoningResolutionResult> {
    // Try VWorld API first if available
    if (isVWorldAvailable()) {
      const vworldResult = await this.resolveZoningFromVWorld(parcel)
      if (vworldResult.success) {
        return vworldResult
      }
      console.warn('VWorld zoning lookup failed, trying data.go.kr:', vworldResult.error)
    }

    // Try data.go.kr regulation service
    if (isDataGoKrAvailable()) {
      const dataGoKrResult = await this.resolveZoningFromDataGoKr(parcel)
      if (dataGoKrResult.success) {
        return dataGoKrResult
      }
      console.warn('data.go.kr zoning lookup failed:', dataGoKrResult.error)
    }

    // No API available or all APIs failed
    // Instead of returning hardcoded data, return an error with guidance
    if (!isVWorldAvailable() && !isDataGoKrAvailable()) {
      // APIs not configured - use district inference with warning
      const district = parcel.jibunAddress.sigungu
      const zoningCode = DISTRICT_ZONING_MAP[district]

      if (zoningCode) {
        return {
          success: true,
          zoningCode,
          zoningName: this.getZoningKoreanName(zoningCode),
          method: 'inference',
          confidence: 'low',
          overlays: [],
        }
      }
    }

    // APIs configured but failed - return error prompting manual override
    return {
      success: false,
      method: 'api',
      confidence: 'low',
      error: '용도지역 정보를 가져올 수 없습니다. 용도지역을 수동으로 선택해 주세요.',
    }
  }

  /**
   * Resolve zoning from data.go.kr LuArinfo API
   */
  private async resolveZoningFromDataGoKr(parcel: KoreaParcel): Promise<ZoningResolutionResult> {
    const client = getDataGoKrClient()
    if (!client) {
      return {
        success: false,
        method: 'inference',
        confidence: 'low',
        error: 'data.go.kr client not available',
      }
    }

    try {
      const result = await client.fetchRegulationsByPNU(parcel.pnu.full)

      if (result.success && result.zoningCode) {
        const zoningCode = result.zoningCode as ZoningCode
        const regulations = SEOUL_REGULATIONS[zoningCode]

        if (regulations) {
          return {
            success: true,
            zoningCode,
            zoningName: result.zoningName || this.getZoningKoreanName(zoningCode),
            method: 'api',
            confidence: 'high',
            overlays: result.regulations
              ?.filter(r => !r.code.startsWith('UQA')) // Filter out the primary zone
              .map(r => ({
                type: 'OTHER' as const,
                name: r.name,
                restrictions: r.legalBasis ? [r.legalBasis] : undefined,
                source: 'data.go.kr LuArinfoService',
              })) || [],
          }
        }

        // Zoning code not in our DB but API returned data
        return {
          success: true,
          zoningCode,
          zoningName: result.zoningName,
          method: 'api',
          confidence: 'medium',
          overlays: [],
        }
      }

      return {
        success: false,
        method: 'api',
        confidence: 'low',
        error: result.error || 'No zoning data found',
      }
    } catch (error) {
      return {
        success: false,
        method: 'api',
        confidence: 'low',
        error: error instanceof Error ? error.message : 'data.go.kr API error',
      }
    }
  }

  /**
   * Resolve zoning from VWorld API
   */
  private async resolveZoningFromVWorld(parcel: KoreaParcel): Promise<ZoningResolutionResult> {
    const client = getVWorldClient()
    if (!client) {
      return {
        success: false,
        method: 'inference',
        confidence: 'low',
        error: 'VWorld client not available',
      }
    }

    try {
      // Get center coordinates from parcel geometry
      const coords = parcel.geometry.coordinates[0]
      const centerLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length
      const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length

      const result = await client.fetchZoningByCoordinates(centerLng, centerLat)

      if (result.success && result.zoningCode) {
        // Validate the zoning code is one we recognize
        const zoningCode = result.zoningCode as ZoningCode
        const regulations = SEOUL_REGULATIONS[zoningCode]

        if (regulations) {
          return {
            success: true,
            zoningCode,
            zoningName: result.zoningName || this.getZoningKoreanName(zoningCode),
            method: 'api',
            confidence: 'high',
            overlays: [],
          }
        }

        // If zoning code not in our DB, return with unknown confidence
        return {
          success: true,
          zoningCode,
          zoningName: result.zoningName,
          method: 'api',
          confidence: 'medium',
          overlays: [],
        }
      }

      return {
        success: false,
        method: 'api',
        confidence: 'low',
        error: result.error || 'No zoning data found',
      }
    } catch (error) {
      return {
        success: false,
        method: 'api',
        confidence: 'low',
        error: error instanceof Error ? error.message : 'VWorld API error',
      }
    }
  }

  async getRegulations(zoningCode: ZoningCode): Promise<RegulationLookupResult> {
    const regulations = getRegulations(zoningCode)

    if (!regulations) {
      return {
        success: false,
        source: 'default',
        confidence: 'low',
        error: `용도지역 코드 "${zoningCode}"를 찾을 수 없습니다.`,
      }
    }

    return {
      success: true,
      regulations,
      source: 'ordinance',
      confidence: 'high',
      specialConditions: regulations.notes,
    }
  }

  async checkZoningOverlays(_parcel: KoreaParcel): Promise<ZoningOverlay[]> {
    // v1: No overlay detection
    // Future: Query 지구단위계획, 정비구역, etc. using _parcel
    return []
  }

  /**
   * Check if a specific land use activity is permitted in a zone
   * Uses arLandUseInfoService API from data.go.kr
   *
   * @param zoningCode Zoning code (e.g., 'R3G' or 'UQA140')
   * @param activityName Activity name in Korean (e.g., '공동주택')
   * @param district District name (e.g., '강남구')
   */
  async checkLandUsePermission(
    zoningCode: string,
    activityName: string,
    district: string = '강남구'
  ): Promise<LandUsePermissionResult> {
    const client = getDataGoKrClient()
    if (!client) {
      return {
        success: false,
        error: 'data.go.kr API key not configured',
        source: 'DATA_GO_KR',
      }
    }

    return client.checkLandUsePermission(zoningCode, activityName, district)
  }

  /**
   * Get permissions for common building types in a zone
   * Useful for displaying what can be built in a specific zone
   *
   * @param zoningCode Zoning code (e.g., 'R3G')
   * @param district District name (e.g., '강남구')
   */
  async getZonePermissions(
    zoningCode: string,
    district: string = '강남구'
  ): Promise<ZonePermissionsResult> {
    const client = getDataGoKrClient()
    if (!client) {
      return {
        success: false,
        error: 'data.go.kr API key not configured',
        source: 'DATA_GO_KR',
      }
    }

    return client.getZonePermissions(zoningCode, district)
  }

  /**
   * Get permitted activities for a parcel based on its resolved zoning
   */
  async getParcelPermissions(parcel: KoreaParcel): Promise<{
    zoningCode?: string
    zoningName?: string
    permissions: LandUseActivityInfo[]
    error?: string
  }> {
    // First resolve zoning for the parcel
    const zoningResult = await this.resolveZoning(parcel)

    if (!zoningResult.success || !zoningResult.zoningCode) {
      return {
        permissions: [],
        error: zoningResult.error || '용도지역을 확인할 수 없습니다.',
      }
    }

    // Get permissions for this zone
    const district = parcel.jibunAddress.sigungu || '강남구'
    const permissionsResult = await this.getZonePermissions(zoningResult.zoningCode, district)

    return {
      zoningCode: zoningResult.zoningCode,
      zoningName: zoningResult.zoningName,
      permissions: permissionsResult.activities || [],
      error: permissionsResult.error,
    }
  }

  // ============================================
  // Private helper methods
  // ============================================

  private parseAddressComponents(
    address: string,
    district: string
  ): {
    dong: string | null
    jibunAddress: JibunAddress | undefined
  } {
    // Try to extract dong
    const dongMatch = address.match(/([가-힣]+[동읍면])/)
    const dong = dongMatch ? dongMatch[1] : null

    // Try to extract jibun (number-number pattern)
    const jibunMatch = address.match(/(산\s*)?(\d+)(-(\d+))?/)

    if (!dong) {
      return { dong: null, jibunAddress: undefined }
    }

    const jibunAddress: JibunAddress = {
      sido: '서울특별시',
      sigungu: district,
      eupmyeondong: dong,
      bonbun: jibunMatch ? parseInt(jibunMatch[2], 10) : 1,
      bubun: jibunMatch && jibunMatch[4] ? parseInt(jibunMatch[4], 10) : undefined,
      isSan: jibunMatch ? !!jibunMatch[1] : false,
    }

    return { dong, jibunAddress }
  }

  private normalizeAddress(
    district: string,
    parsed: { dong: string | null; jibunAddress: JibunAddress | undefined }
  ): string {
    if (parsed.jibunAddress) {
      return formatJibunAddress(parsed.jibunAddress)
    }
    return `서울특별시 ${district}${parsed.dong ? ' ' + parsed.dong : ''}`
  }

  private getCoordinates(
    district: string,
    dong: string | null
  ): [number, number] {
    // For now, return district center
    // Future: More precise geocoding
    const coords = DISTRICT_COORDINATES[district]
    if (coords) {
      // Add small random offset for different addresses
      const offset = dong ? this.hashString(dong) : 0
      return [
        coords[0] + (offset % 100) * 0.00001,
        coords[1] + ((offset / 100) % 100) * 0.00001,
      ]
    }
    // Default to Seoul city center
    return [126.978, 37.5665]
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private generateMockParcel(
    coordinates: [number, number],
    jibunAddress?: JibunAddress
  ): KoreaParcel {
    // IMPORTANT: jibunAddress must be provided with valid district
    // No fallback to hardcoded district - this prevents the Gangnam-gu bug
    if (!jibunAddress || !jibunAddress.sigungu) {
      throw new Error(
        '주소에서 구(區) 정보를 추출할 수 없습니다. 전체 주소를 입력해 주세요. 예: 서울특별시 마포구 합정동 123'
      )
    }

    // Generate realistic Seoul parcel dimensions
    // Typical urban lot: 15-25m x 20-35m
    const widthDeg = 0.0002 // ~17m
    const heightDeg = 0.00028 // ~31m

    const halfW = widthDeg / 2
    const halfH = heightDeg / 2

    const geometry = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [coordinates[0] - halfW, coordinates[1] - halfH],
          [coordinates[0] + halfW, coordinates[1] - halfH],
          [coordinates[0] + halfW, coordinates[1] + halfH],
          [coordinates[0] - halfW, coordinates[1] + halfH],
          [coordinates[0] - halfW, coordinates[1] - halfH],
        ],
      ] as [number, number][][],
      crs: 'EPSG:4326' as const,
    }

    const area = calculateAreaFromGeometry(geometry)

    // Generate PNU using the provided jibunAddress (no fallback)
    const pnu = this.generatePNU(jibunAddress)

    return {
      pnu,
      jibunAddress,
      geometry,
      area: Math.round(area * 100) / 100,
      landUse: {
        category: '대',
        officialLandPrice: 5000000, // 500만원/m² typical for Seoul
        priceYear: 2024,
      },
      retrievedAt: new Date(),
      dataSource: {
        provider: 'LOCAL_MOCK',
        reliability: 'estimated',
      },
    }
  }

  private generatePNU(jibunAddress: JibunAddress): PNU {
    // jibunAddress is now required - no fallback to Gangnam-gu
    const district = jibunAddress.sigungu
    const districtInfo = SEOUL_DISTRICT_CODES[district]

    if (!districtInfo) {
      throw new Error(`알 수 없는 구: "${district}". 서울시 25개 구 중 하나를 입력해 주세요.`)
    }

    const districtCode = districtInfo.code

    const bonbun = jibunAddress.bonbun?.toString() || '1'
    const bubun = jibunAddress.bubun?.toString() || '0'

    const full = buildPNU({
      sido: '11',
      sigungu: districtCode,
      eupmyeondong: '101', // Simplified
      ri: '00',
      bonbun: bonbun.padStart(4, '0'),
      bubun: bubun.padStart(4, '0'),
      sanType: jibunAddress.isSan ? '2' : '1',
    })

    return {
      full,
      sido: '11',
      sigungu: districtCode,
      eupmyeondong: '101',
      ri: '00',
      bonbun: bonbun.padStart(4, '0'),
      bubun: bubun.padStart(4, '0'),
      sanType: jibunAddress.isSan ? '2' : '1',
    }
  }

  private getZoningKoreanName(code: ZoningCode): string {
    const nameMap: Record<ZoningCode, string> = {
      R1E: '제1종전용주거지역',
      R2E: '제2종전용주거지역',
      R1G: '제1종일반주거지역',
      R2G: '제2종일반주거지역',
      R3G: '제3종일반주거지역',
      RSR: '준주거지역',
      CC: '중심상업지역',
      CG: '일반상업지역',
      CN: '근린상업지역',
      CD: '유통상업지역',
      IE: '전용공업지역',
      IG: '일반공업지역',
      ISI: '준공업지역',
      GC: '보전녹지지역',
      GP: '생산녹지지역',
      GN: '자연녹지지역',
    }
    return nameMap[code] || code
  }
}

/**
 * Singleton instance
 */
export const seoulAdapter = new SeoulCityAdapter()
