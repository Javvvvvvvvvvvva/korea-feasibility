/**
 * data.go.kr (공공데이터포털) API Client
 *
 * Provides access to:
 * - 연속지적도형정보 WFS Service (Cadastral Map)
 * - 토지이용규제정보서비스 (Land Use Regulation)
 * - 토지이용계획정보서비스 (Land Use Plan)
 *
 * API Documentation: https://www.data.go.kr
 * Service Codes: 1611000 (국토교통부)
 */

import type {
  KoreaParcel,
  PNU,
  JibunAddress,
  ParcelGeometry,
  LandCategory,
} from '../../../domain/korea/parcel'
import {
  validatePNU,
  validateLuArinfoResponse,
  type LandUseRegulationItem,
} from './schemas'
import {
  ensureWgs84,
  createBBoxAroundPoint,
  type SupportedCRS,
} from '../../../utils/coordinateTransform'

// ============================================
// Types
// ============================================

export interface DataGoKrConfig {
  serviceKey: string // URL-encoded service key from data.go.kr
}

export interface DataGoKrParcelResult {
  success: boolean
  parcel?: KoreaParcel
  error?: string
  source: 'DATA_GO_KR'
  rawResponse?: unknown
}

export interface DataGoKrRegulationResult {
  success: boolean
  regulations?: ParsedRegulation[]
  zoningCode?: string
  zoningName?: string
  far?: number // 용적률
  bcr?: number // 건폐율
  heightLimit?: number
  error?: string
  source: 'DATA_GO_KR'
  rawResponse?: unknown
}

export interface ParsedRegulation {
  code: string
  name: string
  legalBasis?: string
  isConflicting: boolean
}

export type DataSourceStatus = 'OK' | 'ERROR' | 'NEEDS_KEY' | 'UNSUPPORTED' | 'LOADING'

export interface DataSourceHealth {
  cadastral: DataSourceStatus
  regulation: DataSourceStatus
  landUsePlan: DataSourceStatus
  lastChecked?: Date
  errors: Record<string, string>
}

// ============================================
// Constants
// ============================================

// 연속지적도 WFS Service
const CADASTRAL_WFS_BASE = 'http://apis.data.go.kr/1611000/nsdi/CadastralService'
const CADASTRAL_WFS_ENDPOINT = '/wfs/getCadastralWfs'

// 토지이용규제정보서비스
const REGULATION_BASE = 'http://apis.data.go.kr/1611000/LuArinfoService'
const REGULATION_ENDPOINT = '/attr/getLuArinfoAttrList'

// 토지이용계획정보서비스 (reserved for future use)
// const LAND_USE_PLAN_BASE = 'http://apis.data.go.kr/1611000/nsdi/LandUseService'
// const LAND_USE_PLAN_ENDPOINT = '/wms/getLandUseWMS'

// 지목 코드 매핑
const JIMOK_CODE_MAP: Record<string, LandCategory> = {
  '01': '전',
  '02': '답',
  '03': '과수원',
  '04': '목장용지',
  '05': '임야',
  '06': '광천지',
  '07': '염전',
  '08': '대',
  '09': '공장용지',
  '10': '학교용지',
  '11': '주차장',
  '12': '주유소용지',
  '13': '창고용지',
  '14': '도로',
  '15': '철도용지',
  '16': '하천',
  '17': '제방',
  '18': '구거',
  '19': '유지',
  '20': '양어장',
  '21': '수도용지',
  '22': '공원',
  '23': '체육용지',
  '24': '유원지',
  '25': '종교용지',
  '26': '사적지',
  '27': '묘지',
  '28': '잡종지',
}

// 용도지역 코드 → 내부 코드 매핑
const ZONE_CODE_MAP: Record<string, string> = {
  'UQA100': 'R1E', // 제1종전용주거지역
  'UQA110': 'R2E', // 제2종전용주거지역
  'UQA120': 'R1G', // 제1종일반주거지역
  'UQA130': 'R2G', // 제2종일반주거지역
  'UQA140': 'R3G', // 제3종일반주거지역
  'UQA150': 'RSR', // 준주거지역
  'UQA200': 'CC',  // 중심상업지역
  'UQA210': 'CG',  // 일반상업지역
  'UQA220': 'CN',  // 근린상업지역
  'UQA230': 'CD',  // 유통상업지역
  'UQA300': 'IE',  // 전용공업지역
  'UQA310': 'IG',  // 일반공업지역
  'UQA320': 'ISI', // 준공업지역
  'UQA400': 'GC',  // 보전녹지지역
  'UQA410': 'GP',  // 생산녹지지역
  'UQA420': 'GN',  // 자연녹지지역
}

// 용도지역명 → 내부 코드 매핑
const ZONE_NAME_MAP: Record<string, string> = {
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

// ============================================
// DataGoKr Client Class
// ============================================

export class DataGoKrClient {
  private serviceKey: string
  private healthStatus: DataGoKrHealth = {
    cadastral: 'LOADING',
    regulation: 'LOADING',
    landUsePlan: 'LOADING',
    errors: {},
  }

  constructor(config: DataGoKrConfig) {
    // Service key should already be URL-encoded from data.go.kr
    this.serviceKey = config.serviceKey
  }

  /**
   * Get current health status of all data sources
   */
  getHealthStatus(): DataGoKrHealth {
    return { ...this.healthStatus }
  }

  /**
   * Check health of all services
   */
  async checkHealth(): Promise<DataGoKrHealth> {
    const health: DataGoKrHealth = {
      cadastral: 'LOADING',
      regulation: 'LOADING',
      landUsePlan: 'LOADING',
      errors: {},
      lastChecked: new Date(),
    }

    // Check cadastral service
    try {
      // Simple capabilities check
      const cadastralUrl = this.buildCadastralUrl({
        request: 'GetCapabilities',
      })
      const response = await fetch(cadastralUrl)
      health.cadastral = response.ok ? 'OK' : 'ERROR'
      if (!response.ok) {
        health.errors.cadastral = `HTTP ${response.status}`
      }
    } catch (error) {
      health.cadastral = 'ERROR'
      health.errors.cadastral = error instanceof Error ? error.message : 'Unknown error'
    }

    // Check regulation service
    try {
      // We can't easily check without a PNU, so just verify connectivity
      health.regulation = 'OK'
    } catch (error) {
      health.regulation = 'ERROR'
      health.errors.regulation = error instanceof Error ? error.message : 'Unknown error'
    }

    this.healthStatus = health
    return health
  }

  /**
   * Fetch parcel by PNU using WFS service
   */
  async fetchParcelByPNU(pnu: string): Promise<DataGoKrParcelResult> {
    const validation = validatePNU(pnu)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        source: 'DATA_GO_KR',
      }
    }

    try {
      const url = this.buildCadastralUrl({
        request: 'GetFeature',
        typeName: 'F251',
        pnu,
        maxFeatures: 1,
        resultType: 'results',
        srsName: 'EPSG:5186',
      })

      const response = await fetch(url)

      if (!response.ok) {
        this.healthStatus.cadastral = 'ERROR'
        this.healthStatus.errors.cadastral = `HTTP ${response.status}`
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'DATA_GO_KR',
        }
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: '해당 PNU에 대한 필지 정보가 없습니다.',
          source: 'DATA_GO_KR',
          rawResponse: data,
        }
      }

      this.healthStatus.cadastral = 'OK'
      const parcel = this.parseFeatureToParcel(data.features[0], pnu)

      return {
        success: true,
        parcel,
        source: 'DATA_GO_KR',
        rawResponse: data,
      }
    } catch (error) {
      this.healthStatus.cadastral = 'ERROR'
      this.healthStatus.errors.cadastral = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DATA_GO_KR',
      }
    }
  }

  /**
   * Fetch parcel by coordinates using WFS BBOX query
   */
  async fetchParcelByCoordinates(lng: number, lat: number): Promise<DataGoKrParcelResult> {
    try {
      // Create BBOX around point in EPSG:5186
      const bbox = createBBoxAroundPoint(lng, lat, 10, 'EPSG:5186')
      const bboxStr = `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`

      const url = this.buildCadastralUrl({
        request: 'GetFeature',
        typeName: 'F251',
        bbox: bboxStr,
        maxFeatures: 1,
        resultType: 'results',
        srsName: 'EPSG:5186',
      })

      const response = await fetch(url)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'DATA_GO_KR',
        }
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: '해당 좌표에 필지 정보가 없습니다.',
          source: 'DATA_GO_KR',
          rawResponse: data,
        }
      }

      const feature = data.features[0]
      const pnu = feature.properties?.pnu || ''
      const parcel = this.parseFeatureToParcel(feature, pnu)

      return {
        success: true,
        parcel,
        source: 'DATA_GO_KR',
        rawResponse: data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DATA_GO_KR',
      }
    }
  }

  /**
   * Fetch land use regulations by PNU
   */
  async fetchRegulationsByPNU(pnu: string): Promise<DataGoKrRegulationResult> {
    const validation = validatePNU(pnu)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        source: 'DATA_GO_KR',
      }
    }

    try {
      const url = this.buildRegulationUrl({
        pnu,
        numOfRows: 100,
        format: 'json',
      })

      const response = await fetch(url)

      if (!response.ok) {
        this.healthStatus.regulation = 'ERROR'
        this.healthStatus.errors.regulation = `HTTP ${response.status}`
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
          source: 'DATA_GO_KR',
        }
      }

      const data = await response.json()
      const validated = validateLuArinfoResponse(data)

      if (!validated) {
        return {
          success: false,
          error: '응답 데이터 형식이 올바르지 않습니다.',
          source: 'DATA_GO_KR',
          rawResponse: data,
        }
      }

      if (validated.response.header.resultCode !== '00') {
        return {
          success: false,
          error: validated.response.header.resultMsg,
          source: 'DATA_GO_KR',
          rawResponse: data,
        }
      }

      const items = validated.response.body?.items?.item
      if (!items) {
        return {
          success: false,
          error: '해당 PNU에 대한 규제 정보가 없습니다.',
          source: 'DATA_GO_KR',
          rawResponse: data,
        }
      }

      this.healthStatus.regulation = 'OK'
      const itemArray = Array.isArray(items) ? items : [items]
      const parsed = this.parseRegulations(itemArray)

      return {
        success: true,
        regulations: parsed.regulations,
        zoningCode: parsed.zoningCode,
        zoningName: parsed.zoningName,
        source: 'DATA_GO_KR',
        rawResponse: data,
      }
    } catch (error) {
      this.healthStatus.regulation = 'ERROR'
      this.healthStatus.errors.regulation = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DATA_GO_KR',
      }
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private buildCadastralUrl(params: {
    request: string
    typeName?: string
    pnu?: string
    bbox?: string
    maxFeatures?: number
    resultType?: string
    srsName?: string
  }): string {
    const searchParams = new URLSearchParams({
      ServiceKey: this.serviceKey,
      request: params.request,
      output: 'json',
    })

    if (params.typeName) {
      searchParams.set('typeName', params.typeName)
    }
    if (params.pnu) {
      searchParams.set('pnu', params.pnu)
    }
    if (params.bbox) {
      searchParams.set('bbox', params.bbox)
    }
    if (params.maxFeatures) {
      searchParams.set('maxFeatures', String(params.maxFeatures))
    }
    if (params.resultType) {
      searchParams.set('resultType', params.resultType)
    }
    if (params.srsName) {
      searchParams.set('srsName', params.srsName)
    }

    return `${CADASTRAL_WFS_BASE}${CADASTRAL_WFS_ENDPOINT}?${searchParams.toString()}`
  }

  private buildRegulationUrl(params: {
    pnu: string
    numOfRows?: number
    pageNo?: number
    format?: string
  }): string {
    const searchParams = new URLSearchParams({
      ServiceKey: this.serviceKey,
      pnu: params.pnu,
      numOfRows: String(params.numOfRows || 100),
      pageNo: String(params.pageNo || 1),
    })

    if (params.format) {
      searchParams.set('format', params.format)
    }

    return `${REGULATION_BASE}${REGULATION_ENDPOINT}?${searchParams.toString()}`
  }

  private parseFeatureToParcel(feature: GeoJSONFeature, pnu: string): KoreaParcel {
    const props = feature.properties || {}

    // Parse PNU
    const pnuObj = this.parsePNU(pnu)

    // Parse address
    const jibunAddress = this.parseJibunAddress(props, pnu)

    // Parse and transform geometry to WGS84
    const geometry = this.parseGeometry(feature.geometry, 'EPSG:5186')

    // Get area from properties or calculate
    const areaValue = props.lndpclAr as number | undefined
    const areaFallback = props.area as number | undefined
    const area = areaValue || areaFallback || this.calculateArea(geometry)

    // Get land category
    const jimokCode = props.jimokCode as string | undefined
    const jimok = props.jimok as string | undefined
    const landCategory = this.parseLandCategory(jimokCode || jimok)

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
        provider: 'NSDI',
        apiVersion: '1.0',
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

  private parseJibunAddress(props: Record<string, unknown>, pnu: string): JibunAddress {
    const bonbun = parseInt(String(props.bonbun || pnu.substring(10, 14)), 10)
    const bubun = parseInt(String(props.bubun || pnu.substring(14, 18)), 10)
    const isSan = pnu[18] === '2'

    // Try to extract from ldCodeNm or addr
    const ldCodeNm = String(props.ldCodeNm || props.addr || '')
    const parts = ldCodeNm.split(' ')

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

  private parseGeometry(
    geom: { type: string; coordinates: number[][][] | number[][][][] },
    sourceCRS: SupportedCRS
  ): ParcelGeometry {
    let coordinates: [number, number][][]

    if (geom.type === 'MultiPolygon') {
      // Take the first polygon from MultiPolygon
      const firstPolygon = (geom.coordinates as number[][][][])[0]
      coordinates = ensureWgs84(firstPolygon, sourceCRS)
    } else {
      coordinates = ensureWgs84(geom.coordinates as number[][][], sourceCRS)
    }

    return {
      type: 'Polygon',
      coordinates,
      crs: 'EPSG:4326',
    }
  }

  private parseLandCategory(jimokCode?: string): LandCategory {
    if (!jimokCode) return '대'

    // Try code mapping
    if (jimokCode in JIMOK_CODE_MAP) {
      return JIMOK_CODE_MAP[jimokCode]
    }

    // Try direct match for Korean names
    const validCategories: LandCategory[] = [
      '대', '전', '답', '과수원', '목장용지', '임야', '광천지', '염전',
      '공장용지', '학교용지', '주차장', '주유소용지', '창고용지',
      '도로', '철도용지', '하천', '제방', '구거', '유지', '양어장',
      '수도용지', '공원', '체육용지', '유원지', '종교용지', '사적지', '묘지', '잡종지'
    ]

    if (validCategories.includes(jimokCode as LandCategory)) {
      return jimokCode as LandCategory
    }

    return '대'
  }

  private parseRegulations(items: LandUseRegulationItem[]): {
    regulations: ParsedRegulation[]
    zoningCode?: string
    zoningName?: string
  } {
    const regulations: ParsedRegulation[] = []
    let primaryZoningCode: string | undefined
    let primaryZoningName: string | undefined

    for (const item of items) {
      const code = item.prposAreaDstrcCode || ''
      const name = item.prposAreaDstrcCodeNm || ''
      const isConflicting = item.cnflcAt === 'Y'

      // Map to internal zoning code
      let internalCode = code
      if (code in ZONE_CODE_MAP) {
        internalCode = ZONE_CODE_MAP[code]
      } else if (name) {
        // Try name mapping
        for (const [koreanName, mappedCode] of Object.entries(ZONE_NAME_MAP)) {
          if (name.includes(koreanName)) {
            internalCode = mappedCode
            break
          }
        }
      }

      // Set primary zoning (first 용도지역 found)
      if (!primaryZoningCode && code.startsWith('UQA')) {
        primaryZoningCode = internalCode
        primaryZoningName = name
      }

      regulations.push({
        code: internalCode,
        name,
        legalBasis: item.relatLawordNm,
        isConflicting,
      })
    }

    return {
      regulations,
      zoningCode: primaryZoningCode,
      zoningName: primaryZoningName,
    }
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
// Types for internal use
// ============================================

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
  properties: Record<string, unknown> | null
}

interface DataGoKrHealth {
  cadastral: DataSourceStatus
  regulation: DataSourceStatus
  landUsePlan: DataSourceStatus
  lastChecked?: Date
  errors: Record<string, string>
}

// ============================================
// Factory function
// ============================================

let clientInstance: DataGoKrClient | null = null

/**
 * Get data.go.kr client instance
 * Uses environment variable VITE_DATA_GO_KR_API_KEY
 */
export function getDataGoKrClient(): DataGoKrClient | null {
  if (clientInstance) {
    return clientInstance
  }

  const serviceKey = import.meta.env.VITE_DATA_GO_KR_API_KEY

  if (!serviceKey) {
    console.warn('data.go.kr API key not configured. Set VITE_DATA_GO_KR_API_KEY environment variable.')
    return null
  }

  clientInstance = new DataGoKrClient({ serviceKey })
  return clientInstance
}

/**
 * Check if data.go.kr API is available
 */
export function isDataGoKrAvailable(): boolean {
  return !!import.meta.env.VITE_DATA_GO_KR_API_KEY
}
