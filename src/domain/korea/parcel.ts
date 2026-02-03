/**
 * Korea Parcel (필지) Domain Model
 * 한국 필지 도메인 모델
 *
 * Legal Basis:
 * - 공간정보의 구축 및 관리 등에 관한 법률 (공간정보관리법)
 * - 지적법 (구법, 현재 공간정보관리법에 통합)
 *
 * Data Sources:
 * - 국가공간정보포털 (http://www.nsdi.go.kr)
 * - VWORLD API (http://www.vworld.kr)
 * - 토지이용규제정보서비스 LURIS (http://luris.molit.go.kr)
 */

/**
 * PNU (필지고유번호) - Parcel Unique Number
 *
 * 19-digit unique identifier for every parcel in Korea
 * Format: AABBBBCCCDDEEEEFFFF G
 *
 * AA     - 시도 코드 (2 digits)
 * BBBB   - 시군구 코드 (3 digits, padded)
 * CCC    - 읍면동 코드 (3 digits)
 * DD     - 리 코드 (2 digits, 00 for urban areas)
 * EEEE   - 본번 (4 digits, main lot number)
 * FFFF   - 부번 (4 digits, sub lot number)
 * G      - 대지/산 구분 (1 digit: 1=대지, 2=산)
 */
export interface PNU {
  full: string // Complete 19-digit code
  sido: string // 시도 (2 digits)
  sigungu: string // 시군구 (3 digits)
  eupmyeondong: string // 읍면동 (3 digits)
  ri: string // 리 (2 digits)
  bonbun: string // 본번 (4 digits)
  bubun: string // 부번 (4 digits)
  sanType: '1' | '2' // 1=대지, 2=산
}

/**
 * Parse PNU string into components
 */
export function parsePNU(pnu: string): PNU | null {
  if (!pnu || pnu.length !== 19) {
    return null
  }

  const sanType = pnu[18]
  if (sanType !== '1' && sanType !== '2') {
    return null
  }

  return {
    full: pnu,
    sido: pnu.substring(0, 2),
    sigungu: pnu.substring(2, 5),
    eupmyeondong: pnu.substring(5, 8),
    ri: pnu.substring(8, 10),
    bonbun: pnu.substring(10, 14),
    bubun: pnu.substring(14, 18),
    sanType: sanType as '1' | '2',
  }
}

/**
 * Build PNU from components
 */
export function buildPNU(components: Omit<PNU, 'full'>): string {
  return (
    components.sido +
    components.sigungu.padStart(3, '0') +
    components.eupmyeondong.padStart(3, '0') +
    components.ri.padStart(2, '0') +
    components.bonbun.padStart(4, '0') +
    components.bubun.padStart(4, '0') +
    components.sanType
  )
}

/**
 * 지번 (Jibun) Address
 * Traditional lot-number based address
 */
export interface JibunAddress {
  sido: string // 시/도
  sigungu: string // 시/군/구
  eupmyeondong: string // 읍/면/동
  ri?: string // 리 (optional, rural areas)
  bonbun: number // 본번
  bubun?: number // 부번 (optional)
  isSan: boolean // 산 여부
}

/**
 * 도로명 (Road Name) Address
 * Modern road-based address (since 2014)
 */
export interface RoadAddress {
  sido: string // 시/도
  sigungu: string // 시/군/구
  roadName: string // 도로명
  buildingNumber: number // 건물번호 (본번)
  buildingNumberSub?: number // 건물번호 (부번)
  detail?: string // 상세주소
  postalCode?: string // 우편번호
}

/**
 * Parcel Geometry
 * GeoJSON-compatible polygon representation
 */
export interface ParcelGeometry {
  type: 'Polygon'
  /**
   * Coordinates in [longitude, latitude] format
   * First and last point should be the same (closed polygon)
   */
  coordinates: [number, number][][]
  /**
   * Coordinate reference system
   * Korea uses EPSG:5186 (Korea 2000 / Central Belt)
   * or EPSG:4326 (WGS84) for web applications
   */
  crs?: 'EPSG:5186' | 'EPSG:4326'
}

/**
 * Land Category (지목)
 * Based on 공간정보관리법 시행령 제58조
 */
export type LandCategory =
  | '대' // 대지 (Building site)
  | '전' // 전 (Dry field)
  | '답' // 답 (Paddy field)
  | '과수원' // 과수원 (Orchard)
  | '목장용지' // 목장용지 (Pasture)
  | '임야' // 임야 (Forest)
  | '광천지' // 광천지 (Mineral spring)
  | '염전' // 염전 (Salt pan)
  | '공장용지' // 공장용지 (Factory site)
  | '학교용지' // 학교용지 (School site)
  | '주차장' // 주차장 (Parking lot)
  | '주유소용지' // 주유소용지 (Gas station)
  | '창고용지' // 창고용지 (Warehouse)
  | '도로' // 도로 (Road)
  | '철도용지' // 철도용지 (Railroad)
  | '하천' // 하천 (River)
  | '제방' // 제방 (Levee)
  | '구거' // 구거 (Ditch)
  | '유지' // 유지 (Pond)
  | '양어장' // 양어장 (Fish farm)
  | '수도용지' // 수도용지 (Water supply)
  | '공원' // 공원 (Park)
  | '체육용지' // 체육용지 (Sports facility)
  | '유원지' // 유원지 (Amusement park)
  | '종교용지' // 종교용지 (Religious site)
  | '사적지' // 사적지 (Historic site)
  | '묘지' // 묘지 (Cemetery)
  | '잡종지' // 잡종지 (Miscellaneous)

/**
 * Land Use Status (토지이용현황)
 */
export interface LandUseStatus {
  /** Current land category */
  category: LandCategory
  /** Official publicly assessed land price (원/m²) */
  officialLandPrice?: number
  /** Year of price assessment */
  priceYear?: number
}

/**
 * Complete Parcel Information
 */
export interface KoreaParcel {
  /** Parcel unique number */
  pnu: PNU
  /** Jibun address */
  jibunAddress: JibunAddress
  /** Road address (may not exist for undeveloped land) */
  roadAddress?: RoadAddress
  /** Parcel geometry */
  geometry: ParcelGeometry
  /** Area in square meters */
  area: number
  /** Land use status */
  landUse: LandUseStatus
  /** Data retrieval timestamp */
  retrievedAt: Date
  /** Data source */
  dataSource: ParcelDataSource
}

/**
 * Data source information
 */
export interface ParcelDataSource {
  provider: 'VWORLD' | 'NSDI' | 'LURIS' | 'LOCAL_MOCK' | 'USER_INPUT'
  apiVersion?: string
  reliability: 'official' | 'derived' | 'estimated' | 'user_provided'
}

/**
 * Seoul District (구) Codes
 * Based on 행정표준코드관리시스템
 */
export const SEOUL_DISTRICT_CODES: Record<string, { code: string; name: string }> = {
  종로구: { code: '110', name: '종로구' },
  중구: { code: '140', name: '중구' },
  용산구: { code: '170', name: '용산구' },
  성동구: { code: '200', name: '성동구' },
  광진구: { code: '215', name: '광진구' },
  동대문구: { code: '230', name: '동대문구' },
  중랑구: { code: '260', name: '중랑구' },
  성북구: { code: '290', name: '성북구' },
  강북구: { code: '305', name: '강북구' },
  도봉구: { code: '320', name: '도봉구' },
  노원구: { code: '350', name: '노원구' },
  은평구: { code: '380', name: '은평구' },
  서대문구: { code: '410', name: '서대문구' },
  마포구: { code: '440', name: '마포구' },
  양천구: { code: '470', name: '양천구' },
  강서구: { code: '500', name: '강서구' },
  구로구: { code: '530', name: '구로구' },
  금천구: { code: '545', name: '금천구' },
  영등포구: { code: '560', name: '영등포구' },
  동작구: { code: '590', name: '동작구' },
  관악구: { code: '620', name: '관악구' },
  서초구: { code: '650', name: '서초구' },
  강남구: { code: '680', name: '강남구' },
  송파구: { code: '710', name: '송파구' },
  강동구: { code: '740', name: '강동구' },
}

/**
 * Get district code for Seoul gu
 */
export function getSeoulDistrictCode(guName: string): string | null {
  const normalized = guName.replace(/\s/g, '')
  return SEOUL_DISTRICT_CODES[normalized]?.code ?? null
}

/**
 * Format jibun address to string
 */
export function formatJibunAddress(address: JibunAddress): string {
  let result = `${address.sido} ${address.sigungu} `

  if (address.ri) {
    result += `${address.eupmyeondong} ${address.ri} `
  } else {
    result += `${address.eupmyeondong} `
  }

  if (address.isSan) {
    result += '산'
  }

  result += address.bonbun.toString()

  if (address.bubun && address.bubun > 0) {
    result += `-${address.bubun}`
  }

  return result.trim()
}

/**
 * Format road address to string
 */
export function formatRoadAddress(address: RoadAddress): string {
  let result = `${address.sido} ${address.sigungu} ${address.roadName} ${address.buildingNumber}`

  if (address.buildingNumberSub && address.buildingNumberSub > 0) {
    result += `-${address.buildingNumberSub}`
  }

  if (address.detail) {
    result += ` ${address.detail}`
  }

  return result.trim()
}

/**
 * Calculate approximate area from geometry
 * Uses Shoelace formula for polygon area
 *
 * @param geometry - Parcel geometry
 * @returns Area in square meters
 */
export function calculateAreaFromGeometry(geometry: ParcelGeometry): number {
  const coords = geometry.coordinates[0]
  if (coords.length < 3) return 0

  // Approximate meters per degree at Seoul's latitude (~37.5°N)
  const metersPerDegreeLng = 88000
  const metersPerDegreeLat = 111000

  // Convert to approximate meters and calculate area using Shoelace formula
  let area = 0
  const n = coords.length - 1 // Last point is same as first

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

/**
 * Check if a point is inside the parcel
 *
 * @param geometry - Parcel geometry
 * @param point - Point as [lng, lat]
 * @returns true if point is inside
 */
export function isPointInParcel(
  geometry: ParcelGeometry,
  point: [number, number]
): boolean {
  const coords = geometry.coordinates[0]
  const x = point[0]
  const y = point[1]
  let inside = false

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0]
    const yi = coords[i][1]
    const xj = coords[j][0]
    const yj = coords[j][1]

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}
