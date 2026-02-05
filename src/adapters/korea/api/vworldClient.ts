/**
 * VWorld API Client
 * 브이월드 API 클라이언트
 *
 * Primary data source for Korean land/parcel information (as of 2024).
 * Provides access to:
 * - 연속지적도 (Cadastral map / parcel polygons)
 * - 용도지역 (Zoning layers)
 * - 토지이용계획 (Land use plans)
 *
 * API Documentation: https://www.vworld.kr/dev/v4api.do
 */

import type {
  KoreaParcel,
  PNU,
  JibunAddress,
  ParcelGeometry,
  LandCategory,
} from '../../../domain/korea/parcel'

// ============================================
// Types
// ============================================

export interface VWorldConfig {
  apiKey: string
  baseUrl?: string
}

export interface VWorldDataResponse {
  response: {
    status: 'OK' | 'ERROR' | 'NOT_FOUND'
    result?: {
      featureCollection: GeoJSONFeatureCollection
    }
    error?: {
      code: string
      message: string
    }
  }
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  properties: {
    pnu?: string
    addr?: string
    jibun?: string
    bonbun?: string
    bubun?: string
    jimok?: string // 지목
    area?: number
    [key: string]: unknown
  }
}

export interface VWorldParcelResult {
  success: boolean
  parcel?: KoreaParcel
  error?: string
  source: 'VWORLD'
  rawResponse?: VWorldDataResponse
}

export interface VWorldZoningResult {
  success: boolean
  zoningCode?: string
  zoningName?: string
  error?: string
  source: 'VWORLD'
}

// ============================================
// Constants
// ============================================

const DEFAULT_BASE_URL = 'https://api.vworld.kr/req/data'
const WFS_BASE_URL = 'https://api.vworld.kr/req/wfs'

// Service IDs
const SERVICES = {
  CADASTRAL: 'LP_PA_CBND_BUBUN', // 연속지적도
  URBAN_ZONE: 'LT_C_UQ111', // 도시지역
  MGMT_ZONE: 'LT_C_UQ112', // 관리지역
  AGRI_ZONE: 'LT_C_UQ113', // 농림지역
  NATURE_ZONE: 'LT_C_UQ114', // 자연환경보전지역
  LAND_USE_PLAN: 'LT_C_LHBLPN', // 토지이용계획도
} as const

// 지목 코드 매핑
const JIMOK_MAP: Record<string, LandCategory> = {
  대: '대',
  전: '전',
  답: '답',
  과: '과수원',
  목: '목장용지',
  임: '임야',
  광: '광천지',
  염: '염전',
  장: '공장용지',
  학: '학교용지',
  차: '주차장',
  주: '주유소용지',
  창: '창고용지',
  도: '도로',
  철: '철도용지',
  하: '하천',
  제: '제방',
  구: '구거',
  유: '유지',
  양: '양어장',
  수: '수도용지',
  공: '공원',
  체: '체육용지',
  원: '유원지',
  종: '종교용지',
  사: '사적지',
  묘: '묘지',
  잡: '잡종지',
}

// ============================================
// VWorld Client Class
// ============================================

export class VWorldClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: VWorldConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL
  }

  /**
   * Fetch parcel geometry by PNU
   */
  async fetchParcelByPNU(pnu: string): Promise<VWorldParcelResult> {
    if (!pnu || pnu.length !== 19) {
      return {
        success: false,
        error: 'Invalid PNU format. Must be 19 digits.',
        source: 'VWORLD',
      }
    }

    try {
      const url = this.buildDataUrl({
        data: SERVICES.CADASTRAL,
        attrFilter: `pnu:=:${pnu}`,
      })

      const response = await fetch(url)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'VWORLD',
        }
      }

      const data: VWorldDataResponse = await response.json()

      if (data.response.status !== 'OK' || !data.response.result) {
        return {
          success: false,
          error: data.response.error?.message || 'No data found',
          source: 'VWORLD',
          rawResponse: data,
        }
      }

      const features = data.response.result.featureCollection.features
      if (features.length === 0) {
        return {
          success: false,
          error: '해당 PNU에 대한 필지 정보가 없습니다.',
          source: 'VWORLD',
          rawResponse: data,
        }
      }

      const parcel = this.parseFeatureToParcel(features[0], pnu)

      return {
        success: true,
        parcel,
        source: 'VWORLD',
        rawResponse: data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'VWORLD',
      }
    }
  }

  /**
   * Fetch parcel by coordinates using WFS BBOX query
   */
  async fetchParcelByCoordinates(
    lng: number,
    lat: number
  ): Promise<VWorldParcelResult> {
    try {
      // Create a small bounding box around the point
      const delta = 0.0001 // ~10m
      const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')

      const url = this.buildWfsUrl({
        typename: 'lp_pa_cbnd_bubun',
        bbox,
        maxFeatures: 1,
      })

      const response = await fetch(url)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'VWORLD',
        }
      }

      const data = await response.json()

      // WFS returns GeoJSON directly
      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: '해당 좌표에 필지 정보가 없습니다.',
          source: 'VWORLD',
        }
      }

      const feature = data.features[0]
      const pnu = feature.properties?.pnu || ''
      const parcel = this.parseFeatureToParcel(feature, pnu)

      return {
        success: true,
        parcel,
        source: 'VWORLD',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'VWORLD',
      }
    }
  }

  /**
   * Fetch zoning information by PNU
   */
  async fetchZoningByPNU(pnu: string): Promise<VWorldZoningResult> {
    try {
      // Try urban zone first (most common in Seoul)
      const url = this.buildDataUrl({
        data: SERVICES.URBAN_ZONE,
        attrFilter: `pnu:=:${pnu}`,
      })

      const response = await fetch(url)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'VWORLD',
        }
      }

      const data: VWorldDataResponse = await response.json()

      if (
        data.response.status !== 'OK' ||
        !data.response.result?.featureCollection.features.length
      ) {
        // No urban zoning found - might be other zone type
        return {
          success: false,
          error: 'No zoning data found for this PNU',
          source: 'VWORLD',
        }
      }

      const feature = data.response.result.featureCollection.features[0]
      const props = feature.properties

      return {
        success: true,
        zoningCode: props.ucode as string,
        zoningName: props.uname as string,
        source: 'VWORLD',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'VWORLD',
      }
    }
  }

  /**
   * Fetch zoning information by coordinates using WFS BBOX query
   */
  async fetchZoningByCoordinates(lng: number, lat: number): Promise<VWorldZoningResult> {
    try {
      // Create a small bounding box around the point
      const delta = 0.0001 // ~10m
      const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')

      // Try urban zone layer
      const url = this.buildWfsUrl({
        typename: 'lt_c_uq111', // 도시지역
        bbox,
        maxFeatures: 1,
      })

      const response = await fetch(url)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'VWORLD',
        }
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: 'No zoning data found at coordinates',
          source: 'VWORLD',
        }
      }

      const props = data.features[0].properties
      const zoningName = props.uname || props.name || ''
      const zoningCode = this.mapZoningNameToCode(zoningName)

      return {
        success: true,
        zoningCode,
        zoningName,
        source: 'VWORLD',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'VWORLD',
      }
    }
  }

  /**
   * Map Korean zoning name to internal code
   */
  private mapZoningNameToCode(name: string): string {
    const nameMap: Record<string, string> = {
      '제1종전용주거지역': 'R1E',
      '제2종전용주거지역': 'R2E',
      '제1종일반주거지역': 'R1G',
      '제2종일반주거지역': 'R2G',
      '제3종일반주거지역': 'R3G',
      '준주거지역': 'RSR',
      '중심상업지역': 'CC',
      '일반상업지역': 'CG',
      '근린상업지역': 'CN',
      '유통상업지역': 'CD',
      '전용공업지역': 'IE',
      '일반공업지역': 'IG',
      '준공업지역': 'ISI',
      '보전녹지지역': 'GC',
      '생산녹지지역': 'GP',
      '자연녹지지역': 'GN',
    }

    // Try exact match
    if (name in nameMap) {
      return nameMap[name]
    }

    // Try partial match
    for (const [koreanName, code] of Object.entries(nameMap)) {
      if (name.includes(koreanName)) {
        return code
      }
    }

    return name // Return original if no match
  }

  // ============================================
  // Private helpers
  // ============================================

  private buildDataUrl(params: {
    data: string
    attrFilter?: string
    page?: number
    size?: number
    crs?: string
  }): string {
    const searchParams = new URLSearchParams({
      service: 'data',
      request: 'GetFeature',
      data: params.data,
      key: this.apiKey,
      page: String(params.page || 1),
      size: String(params.size || 100),
      crs: params.crs || 'EPSG:4326',
      format: 'json',
    })

    if (params.attrFilter) {
      searchParams.set('attrFilter', params.attrFilter)
    }

    return `${this.baseUrl}?${searchParams.toString()}`
  }

  private buildWfsUrl(params: {
    typename: string
    bbox?: string
    maxFeatures?: number
    srsName?: string
  }): string {
    const searchParams = new URLSearchParams({
      REQUEST: 'GetFeature',
      TYPENAME: params.typename,
      VERSION: '1.1.0',
      SRSNAME: params.srsName || 'EPSG:4326',
      OUTPUT: 'json',
      KEY: this.apiKey,
    })

    if (params.bbox) {
      searchParams.set('BBOX', params.bbox)
    }

    if (params.maxFeatures) {
      searchParams.set('MAXFEATURES', String(params.maxFeatures))
    }

    return `${WFS_BASE_URL}?${searchParams.toString()}`
  }

  private parseFeatureToParcel(feature: GeoJSONFeature, pnu: string): KoreaParcel {
    const props = feature.properties

    // Parse PNU into components
    const pnuObj = this.parsePNU(pnu)

    // Parse address from properties
    const jibunAddress = this.parseJibunAddress(props, pnu)

    // Convert geometry
    const geometry = this.parseGeometry(feature.geometry)

    // Calculate area (use provided area or calculate from geometry)
    const area = props.area || this.calculateArea(geometry)

    // Get land category
    const landCategory = this.parseLandCategory(props.jimok)

    return {
      pnu: pnuObj,
      jibunAddress,
      geometry,
      area,
      landUse: {
        category: landCategory,
      },
      retrievedAt: new Date(),
      dataSource: {
        provider: 'VWORLD',
        apiVersion: '2.0',
        reliability: 'official',
      },
    }
  }

  private parsePNU(pnu: string): PNU {
    return {
      full: pnu,
      sido: pnu.substring(0, 2),
      sigungu: pnu.substring(2, 5),
      eupmyeondong: pnu.substring(5, 8),
      ri: pnu.substring(8, 10),
      bonbun: pnu.substring(10, 14),
      bubun: pnu.substring(14, 18),
      sanType: pnu[18] === '2' ? '2' : '1',
    }
  }

  private parseJibunAddress(
    props: GeoJSONFeature['properties'],
    pnu: string
  ): JibunAddress {
    // Extract from address string or properties
    const addr = props.addr || ''
    const parts = addr.split(' ')

    // Default parsing from PNU if address not available
    const bonbun = parseInt(props.bonbun || pnu.substring(10, 14), 10)
    const bubun = parseInt(props.bubun || pnu.substring(14, 18), 10)
    const isSan = pnu[18] === '2'

    // Try to extract sido/sigungu/dong from address
    let sido = '서울특별시'
    let sigungu = ''
    let dong = ''

    if (parts.length >= 3) {
      sido = parts[0]
      sigungu = parts[1]
      dong = parts[2]
    } else if (parts.length === 2) {
      sigungu = parts[0]
      dong = parts[1]
    } else if (parts.length === 1) {
      dong = parts[0]
    }

    return {
      sido,
      sigungu,
      eupmyeondong: dong,
      bonbun,
      bubun: bubun > 0 ? bubun : undefined,
      isSan,
    }
  }

  private parseGeometry(geom: GeoJSONFeature['geometry']): ParcelGeometry {
    // Handle MultiPolygon by taking first polygon
    let coordinates: [number, number][][]

    if (geom.type === 'MultiPolygon') {
      // Take the first polygon from MultiPolygon
      const firstPolygon = geom.coordinates[0] as number[][][]
      coordinates = firstPolygon.map((ring) =>
        ring.map((coord) => [coord[0], coord[1]] as [number, number])
      )
    } else {
      coordinates = (geom.coordinates as number[][][]).map((ring) =>
        ring.map((coord) => [coord[0], coord[1]] as [number, number])
      )
    }

    return {
      type: 'Polygon',
      coordinates,
      crs: 'EPSG:4326',
    }
  }

  private parseLandCategory(jimok?: string): LandCategory {
    if (!jimok) return '대'

    // Try direct match first
    if (jimok in JIMOK_MAP) {
      return JIMOK_MAP[jimok]
    }

    // Try first character match
    const firstChar = jimok.charAt(0)
    if (firstChar in JIMOK_MAP) {
      return JIMOK_MAP[firstChar]
    }

    return '대' // Default to building site
  }

  private calculateArea(geometry: ParcelGeometry): number {
    const coords = geometry.coordinates[0]
    if (coords.length < 3) return 0

    // Approximate meters per degree at Seoul's latitude
    const metersPerDegreeLng = 88000
    const metersPerDegreeLat = 111000

    let area = 0
    const n = coords.length - 1

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const xi = coords[i][0] * metersPerDegreeLng
      const yi = coords[i][1] * metersPerDegreeLat
      const xj = coords[j][0] * metersPerDegreeLng
      const yj = coords[j][1] * metersPerDegreeLat

      area += xi * yj
      area -= xj * yi
    }

    return Math.abs(area / 2)
  }
}

// ============================================
// Factory function
// ============================================

let clientInstance: VWorldClient | null = null

/**
 * Get VWorld client instance
 * Uses environment variable VITE_VWORLD_API_KEY
 */
export function getVWorldClient(): VWorldClient | null {
  if (clientInstance) {
    return clientInstance
  }

  const apiKey = import.meta.env.VITE_VWORLD_API_KEY

  if (!apiKey) {
    console.warn('VWorld API key not configured. Set VITE_VWORLD_API_KEY environment variable.')
    return null
  }

  clientInstance = new VWorldClient({ apiKey })
  return clientInstance
}

/**
 * Check if VWorld API is available
 */
export function isVWorldAvailable(): boolean {
  return !!import.meta.env.VITE_VWORLD_API_KEY
}
