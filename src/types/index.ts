/**
 * Korea Urban Feasibility Type Definitions
 * 한국 도시개발 타당성 분석 타입 정의
 */

// 필지 (Parcel) 정보
export interface Parcel {
  pnu: string // 필지고유번호 (19자리)
  address: {
    full: string // 전체 주소
    sido: string // 시/도
    sigungu: string // 시/군/구
    dong: string // 동/읍/면
    jibun: string // 지번
  }
  geometry: ParcelGeometry
  area: number // m²
}

export interface ParcelGeometry {
  type: 'Polygon'
  coordinates: number[][][] // [[[lng, lat], ...]]
}

// 용도지역 (Zoning) 정보
export interface ZoningInfo {
  code: string // 용도지역 코드
  name: string // 용도지역명 (e.g., "제2종일반주거지역")
  category: ZoningCategory
  regulations: ZoningRegulations
  source: DataSource
}

export type ZoningCategory =
  | 'residential' // 주거지역
  | 'commercial' // 상업지역
  | 'industrial' // 공업지역
  | 'green' // 녹지지역
  | 'management' // 관리지역
  | 'agricultural' // 농림지역
  | 'natural' // 자연환경보전지역

export interface ZoningRegulations {
  far: RegulatoryValue // 용적률 (Floor Area Ratio)
  bcr: RegulatoryValue // 건폐율 (Building Coverage Ratio)
  heightLimit: RegulatoryValue // 높이제한
}

export interface RegulatoryValue {
  value: number | null
  unit: '%' | 'm' | 'floors'
  source: 'law' | 'ordinance' | 'assumed' | 'unknown'
  confidence: ConfidenceLevel
  legalBasis?: string // 법적 근거
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown'

// 데이터 출처
export interface DataSource {
  name: string
  type: 'api' | 'manual' | 'calculated'
  retrievedAt: Date
  reliability: ConfidenceLevel
}

// 매싱 (Massing) 결과
export interface MassingResult {
  envelope: BuildingEnvelope
  statistics: MassingStatistics
  confidence: ConfidenceLevel
}

export interface BuildingEnvelope {
  footprint: number[][] // 건축 가능 영역 좌표
  maxHeight: number // 최대 높이 (m)
  setbacks: Setbacks // 이격거리
}

export interface Setbacks {
  front: number
  rear: number
  left: number
  right: number
}

export interface MassingStatistics {
  grossFloorArea: number // 연면적 (m²)
  buildingCoverage: number // 건축면적 (m²)
  estimatedFloors: number // 추정 층수
  farUsed: number // 사용 용적률 (%)
  bcrUsed: number // 사용 건폐율 (%)
}

// 신뢰도 표시 정보
export interface ConfidenceReport {
  known: ConfidenceItem[]
  assumed: ConfidenceItem[]
  missing: ConfidenceItem[]
}

export interface ConfidenceItem {
  label: string
  value?: string
  source?: string
  legalBasis?: string // 법적 근거 (법령 조항)
  legalArticle?: string // 구체적 조문 (예: 제55조)
  dataCategory?: 'regulation' | 'parcel' | 'calculation' | 'overlay'
}

// 애플리케이션 상태
export type FeasibilityStatus =
  | 'idle'
  | 'resolving_address'
  | 'fetching_parcel'
  | 'resolving_zoning'
  | 'calculating_massing'
  | 'complete'
  | 'error'

export interface FeasibilityState {
  status: FeasibilityStatus
  address: string
  parcel: Parcel | null
  zoning: ZoningInfo | null
  massing: MassingResult | null
  confidence: ConfidenceReport | null
  error: string | null
}
