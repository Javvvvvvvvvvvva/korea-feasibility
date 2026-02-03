/**
 * City Adapter Interface
 * 도시별 어댑터 인터페이스
 *
 * This interface defines the contract for city-specific implementations.
 * Each city adapter handles:
 * - Address resolution (geocoding)
 * - Parcel data fetching (cadastral)
 * - Zoning resolution (land use regulations)
 * - Municipal regulation lookup
 *
 * Current Implementation: Seoul (서울특별시) v1
 * Future: Busan, Incheon, Daegu, etc.
 */

import type { KoreaParcel, JibunAddress, RoadAddress } from './parcel'
import type { ZoningCode } from './zoning'
import type { BuildingRegulations } from './regulations'

/**
 * Supported Cities
 * Add new cities here as adapters are implemented
 */
export type SupportedCity =
  | 'SEOUL' // 서울특별시
// Future:
// | 'BUSAN'      // 부산광역시
// | 'INCHEON'    // 인천광역시
// | 'DAEGU'      // 대구광역시
// | 'DAEJEON'    // 대전광역시
// | 'GWANGJU'    // 광주광역시
// | 'ULSAN'      // 울산광역시
// | 'SEJONG'     // 세종특별자치시

/**
 * City Metadata
 */
export interface CityInfo {
  code: SupportedCity
  nameKorean: string
  nameEnglish: string
  sidoCode: string // 시도코드 (2 digits)
  population?: number
  areaKm2?: number
  districts: string[] // List of 구/군
}

/**
 * Address Resolution Result
 */
export interface ResolvedAddressResult {
  success: boolean
  /** Original input */
  input: string
  /** Normalized address string */
  normalized?: string
  /** Jibun address components */
  jibunAddress?: JibunAddress
  /** Road address components */
  roadAddress?: RoadAddress
  /** Geocoded coordinates [lng, lat] */
  coordinates?: [number, number]
  /** Resolution confidence */
  confidence: 'exact' | 'approximate' | 'district_level' | 'failed'
  /** Error message if failed */
  error?: string
}

/**
 * Parcel Fetch Result
 */
export interface ParcelFetchResult {
  success: boolean
  parcel?: KoreaParcel
  /** Data source information */
  source: 'api' | 'cache' | 'mock'
  /** Confidence in the data */
  confidence: 'official' | 'derived' | 'estimated'
  /** Error message if failed */
  error?: string
}

/**
 * Zoning Resolution Result
 */
export interface ZoningResolutionResult {
  success: boolean
  /** Zoning code */
  zoningCode?: ZoningCode
  /** Korean name of zoning */
  zoningName?: string
  /** Resolution method */
  method: 'api' | 'inference' | 'manual' | 'default'
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  /** Additional zoning layers (지구단위계획, etc.) */
  overlays?: ZoningOverlay[]
  /** Error message if failed */
  error?: string
}

/**
 * Zoning Overlay (additional restrictions)
 */
export interface ZoningOverlay {
  type:
    | 'DISTRICT_UNIT_PLAN' // 지구단위계획
    | 'REDEVELOPMENT_ZONE' // 정비구역
    | 'SPECIAL_ZONE' // 특별계획구역
    | 'HISTORIC_DISTRICT' // 역사문화미관지구
    | 'HEIGHT_DISTRICT' // 고도지구
    | 'SCENIC_DISTRICT' // 경관지구
    | 'FIRE_DISTRICT' // 방화지구
    | 'OTHER'
  name: string
  restrictions?: string[]
  source?: string
}

/**
 * Regulation Lookup Result
 */
export interface RegulationLookupResult {
  success: boolean
  regulations?: BuildingRegulations
  /** Any special conditions or adjustments */
  specialConditions?: string[]
  /** Source of regulation data */
  source: 'ordinance' | 'district_plan' | 'special_zone' | 'default'
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low'
  /** Error message if failed */
  error?: string
}

/**
 * City Adapter Interface
 * Each city implements this interface
 */
export interface ICityAdapter {
  /**
   * Get city information
   */
  getCityInfo(): CityInfo

  /**
   * Check if an address string belongs to this city
   */
  isAddressInCity(address: string): boolean

  /**
   * Resolve address to coordinates and structured format
   */
  resolveAddress(input: string): Promise<ResolvedAddressResult>

  /**
   * Fetch parcel data for a given address or coordinates
   */
  fetchParcel(
    address: ResolvedAddressResult | [number, number]
  ): Promise<ParcelFetchResult>

  /**
   * Resolve zoning for a parcel
   */
  resolveZoning(parcel: KoreaParcel): Promise<ZoningResolutionResult>

  /**
   * Get building regulations for a specific zoning code
   */
  getRegulations(zoningCode: ZoningCode): Promise<RegulationLookupResult>

  /**
   * Check for zoning overlays (district plans, special zones, etc.)
   */
  checkZoningOverlays(parcel: KoreaParcel): Promise<ZoningOverlay[]>
}

/**
 * City Adapter Registry
 * Manages available city adapters
 */
export class CityAdapterRegistry {
  private adapters: Map<SupportedCity, ICityAdapter> = new Map()

  /**
   * Register a city adapter
   */
  register(city: SupportedCity, adapter: ICityAdapter): void {
    this.adapters.set(city, adapter)
  }

  /**
   * Get adapter for a city
   */
  getAdapter(city: SupportedCity): ICityAdapter | undefined {
    return this.adapters.get(city)
  }

  /**
   * Get adapter that can handle an address
   */
  getAdapterForAddress(address: string): ICityAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.isAddressInCity(address)) {
        return adapter
      }
    }
    return undefined
  }

  /**
   * List all registered cities
   */
  getRegisteredCities(): SupportedCity[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * Check if a city is supported
   */
  isSupported(city: SupportedCity): boolean {
    return this.adapters.has(city)
  }
}

/**
 * Global adapter registry instance
 */
export const cityAdapterRegistry = new CityAdapterRegistry()

/**
 * Seoul City Information
 */
export const SEOUL_CITY_INFO: CityInfo = {
  code: 'SEOUL',
  nameKorean: '서울특별시',
  nameEnglish: 'Seoul Metropolitan City',
  sidoCode: '11',
  population: 9_428_000, // 2023 estimate
  areaKm2: 605.2,
  districts: [
    '종로구',
    '중구',
    '용산구',
    '성동구',
    '광진구',
    '동대문구',
    '중랑구',
    '성북구',
    '강북구',
    '도봉구',
    '노원구',
    '은평구',
    '서대문구',
    '마포구',
    '양천구',
    '강서구',
    '구로구',
    '금천구',
    '영등포구',
    '동작구',
    '관악구',
    '서초구',
    '강남구',
    '송파구',
    '강동구',
  ],
}

/**
 * Utility: Check if an address is a Seoul address
 */
export function isSeoulAddress(address: string): boolean {
  const seoulPatterns = [
    /^서울/,
    /서울특별시/,
    /서울시/,
    /^seoul/i,
  ]

  return seoulPatterns.some((pattern) => pattern.test(address.trim()))
}

/**
 * Utility: Extract district (구) from address
 */
export function extractDistrict(address: string): string | null {
  const match = address.match(/([가-힣]+구)/)
  return match ? match[1] : null
}

/**
 * Utility: Validate address format
 */
export function validateAddressFormat(address: string): {
  valid: boolean
  type: 'jibun' | 'road' | 'unknown'
  issues: string[]
} {
  const issues: string[] = []

  if (!address || address.trim().length < 5) {
    issues.push('주소가 너무 짧습니다')
    return { valid: false, type: 'unknown', issues }
  }

  // Check for road address pattern
  const roadPattern = /([가-힣]+로|[가-힣]+길)\s*\d+/
  if (roadPattern.test(address)) {
    return { valid: true, type: 'road', issues }
  }

  // Check for jibun address pattern
  const jibunPattern = /([가-힣]+동|[가-힣]+리)\s*(산\s*)?\d+(-\d+)?/
  if (jibunPattern.test(address)) {
    return { valid: true, type: 'jibun', issues }
  }

  issues.push('주소 형식을 인식할 수 없습니다')
  return { valid: false, type: 'unknown', issues }
}
