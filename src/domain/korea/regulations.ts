/**
 * Korea Building Regulations Domain Model
 * 한국 건축규제 도메인 모델
 *
 * Legal Basis:
 * - 국토의 계획 및 이용에 관한 법률 제77조, 제78조
 * - 국토의 계획 및 이용에 관한 법률 시행령 제84조, 제85조
 * - 서울특별시 도시계획 조례 제54조, 제55조
 *
 * Note: Values are based on Seoul Metropolitan City ordinance.
 * Other municipalities may have different values within national limits.
 */

import type { ZoningCode } from './zoning'

/**
 * 건폐율 (Building Coverage Ratio / BCR)
 * Maximum percentage of lot area that can be covered by building footprint
 *
 * Legal: 국토계획법 제77조, 시행령 제84조
 */
export interface BCRRegulation {
  /** National maximum limit (국토계획법 시행령) */
  nationalMax: number
  /** Seoul municipal limit (서울시 조례) */
  seoulMax: number
  /** Typical/recommended value */
  typical: number
  /** Unit (always %) */
  unit: '%'
  /** Legal reference */
  legalBasis: string
}

/**
 * 용적률 (Floor Area Ratio / FAR)
 * Maximum ratio of total floor area to lot area
 *
 * Legal: 국토계획법 제78조, 시행령 제85조
 */
export interface FARRegulation {
  /** National maximum limit (국토계획법 시행령) */
  nationalMax: number
  /** Seoul municipal limit (서울시 조례) */
  seoulMax: number
  /** Typical/recommended value for general development */
  typical: number
  /** Unit (always %) */
  unit: '%'
  /** Legal reference */
  legalBasis: string
}

/**
 * 높이제한 (Building Height Limit)
 * Note: Korea doesn't have universal height limits by zoning.
 * Height is typically controlled by FAR, 일조권 사선제한, and 도로사선제한.
 */
export interface HeightRegulation {
  /** Maximum height in meters (null if not specified) */
  maxHeight: number | null
  /** Floor limit (null if not specified) */
  maxFloors: number | null
  /** Source of limit */
  source: 'ordinance' | 'district_plan' | 'calculated' | 'none'
  /** Legal reference */
  legalBasis: string | null
}

/**
 * Complete Building Regulations for a Zoning Type
 */
export interface BuildingRegulations {
  zoningCode: ZoningCode
  bcr: BCRRegulation
  far: FARRegulation
  height: HeightRegulation
  /** Additional notes or special conditions */
  notes?: string[]
}

/**
 * Seoul Building Regulations by Zoning Code
 *
 * Source: 서울특별시 도시계획 조례 제54조, 제55조
 * Retrieved: 2024 (verify with current ordinance)
 *
 * IMPORTANT: These values represent general limits.
 * Actual limits may vary based on:
 * - 지구단위계획 (District Unit Plan)
 * - 정비구역 (Redevelopment Zone)
 * - 특별계획구역 (Special Planning Zone)
 * - 기타 상위계획 (Other higher-level plans)
 */
export const SEOUL_REGULATIONS: Record<ZoningCode, BuildingRegulations> = {
  // ============================================
  // 주거지역 (Residential Zones)
  // ============================================
  R1E: {
    zoningCode: 'R1E',
    bcr: {
      nationalMax: 50,
      seoulMax: 50,
      typical: 50,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제1호',
    },
    far: {
      nationalMax: 100,
      seoulMax: 100,
      typical: 80,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제1호',
    },
    height: {
      maxHeight: null,
      maxFloors: 4,
      source: 'ordinance',
      legalBasis: '건축법 시행령 별표1 (단독주택)',
    },
    notes: ['단독주택 중심', '4층 이하 권장'],
  },
  R2E: {
    zoningCode: 'R2E',
    bcr: {
      nationalMax: 50,
      seoulMax: 50,
      typical: 50,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제2호',
    },
    far: {
      nationalMax: 150,
      seoulMax: 150,
      typical: 120,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제2호',
    },
    height: {
      maxHeight: null,
      maxFloors: 7,
      source: 'ordinance',
      legalBasis: null,
    },
    notes: ['공동주택 중심', '7층 이하 권장'],
  },
  R1G: {
    zoningCode: 'R1G',
    bcr: {
      nationalMax: 60,
      seoulMax: 60,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제3호',
    },
    far: {
      nationalMax: 200,
      seoulMax: 200,
      typical: 150,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제3호',
    },
    height: {
      maxHeight: null,
      maxFloors: 4,
      source: 'ordinance',
      legalBasis: '서울특별시 도시계획 조례 제55조',
    },
    notes: ['저층주택 중심', '4층 이하'],
  },
  R2G: {
    zoningCode: 'R2G',
    bcr: {
      nationalMax: 60,
      seoulMax: 60,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제4호',
    },
    far: {
      nationalMax: 250,
      seoulMax: 250,
      typical: 200,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제4호',
    },
    height: {
      maxHeight: null,
      maxFloors: 12,
      source: 'ordinance',
      legalBasis: '서울특별시 도시계획 조례 제55조',
    },
    notes: ['중층주택 중심', '12층 이하 일반적'],
  },
  R3G: {
    zoningCode: 'R3G',
    bcr: {
      nationalMax: 50,
      seoulMax: 50,
      typical: 50,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제5호',
    },
    far: {
      nationalMax: 300,
      seoulMax: 300,
      typical: 250,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제5호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['중고층주택 중심', '층수 제한 없음 (FAR/일조권 제한)'],
  },
  RSR: {
    zoningCode: 'RSR',
    bcr: {
      nationalMax: 70,
      seoulMax: 70,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제6호',
    },
    far: {
      nationalMax: 500,
      seoulMax: 500,
      typical: 400,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제6호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['주거 + 상업/업무 혼합'],
  },

  // ============================================
  // 상업지역 (Commercial Zones)
  // ============================================
  CC: {
    zoningCode: 'CC',
    bcr: {
      nationalMax: 90,
      seoulMax: 90,
      typical: 80,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제7호',
    },
    far: {
      nationalMax: 1500,
      seoulMax: 1500,
      typical: 1000,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제7호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['도심/부도심 최고밀도', '초고층 가능'],
  },
  CG: {
    zoningCode: 'CG',
    bcr: {
      nationalMax: 80,
      seoulMax: 80,
      typical: 70,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제8호',
    },
    far: {
      nationalMax: 1300,
      seoulMax: 1300,
      typical: 800,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제8호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['일반 상업/업무 지역'],
  },
  CN: {
    zoningCode: 'CN',
    bcr: {
      nationalMax: 70,
      seoulMax: 70,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제9호',
    },
    far: {
      nationalMax: 900,
      seoulMax: 900,
      typical: 600,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제9호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['근린생활 서비스 중심'],
  },
  CD: {
    zoningCode: 'CD',
    bcr: {
      nationalMax: 80,
      seoulMax: 80,
      typical: 70,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제10호',
    },
    far: {
      nationalMax: 1100,
      seoulMax: 1100,
      typical: 800,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제10호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['유통/물류 시설 중심'],
  },

  // ============================================
  // 공업지역 (Industrial Zones)
  // ============================================
  IE: {
    zoningCode: 'IE',
    bcr: {
      nationalMax: 70,
      seoulMax: 70,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제11호',
    },
    far: {
      nationalMax: 300,
      seoulMax: 300,
      typical: 200,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제11호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['중화학공업 전용', '주거 불가'],
  },
  IG: {
    zoningCode: 'IG',
    bcr: {
      nationalMax: 70,
      seoulMax: 70,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제12호',
    },
    far: {
      nationalMax: 350,
      seoulMax: 350,
      typical: 250,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제12호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['일반 공업 시설'],
  },
  ISI: {
    zoningCode: 'ISI',
    bcr: {
      nationalMax: 70,
      seoulMax: 70,
      typical: 60,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제13호',
    },
    far: {
      nationalMax: 400,
      seoulMax: 400,
      typical: 300,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제13호',
    },
    height: {
      maxHeight: null,
      maxFloors: null,
      source: 'none',
      legalBasis: null,
    },
    notes: ['경공업 + 주거/상업 혼합 가능'],
  },

  // ============================================
  // 녹지지역 (Green Zones)
  // ============================================
  GC: {
    zoningCode: 'GC',
    bcr: {
      nationalMax: 20,
      seoulMax: 20,
      typical: 20,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제14호',
    },
    far: {
      nationalMax: 80,
      seoulMax: 80,
      typical: 50,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제14호',
    },
    height: {
      maxHeight: null,
      maxFloors: 4,
      source: 'ordinance',
      legalBasis: null,
    },
    notes: ['개발 최소화', '자연환경 보전'],
  },
  GP: {
    zoningCode: 'GP',
    bcr: {
      nationalMax: 20,
      seoulMax: 20,
      typical: 20,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제15호',
    },
    far: {
      nationalMax: 100,
      seoulMax: 100,
      typical: 80,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제15호',
    },
    height: {
      maxHeight: null,
      maxFloors: 4,
      source: 'ordinance',
      legalBasis: null,
    },
    notes: ['농업 생산 용도'],
  },
  GN: {
    zoningCode: 'GN',
    bcr: {
      nationalMax: 20,
      seoulMax: 20,
      typical: 20,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제54조제1항제16호',
    },
    far: {
      nationalMax: 100,
      seoulMax: 100,
      typical: 80,
      unit: '%',
      legalBasis: '서울특별시 도시계획 조례 제55조제1항제16호',
    },
    height: {
      maxHeight: null,
      maxFloors: 4,
      source: 'ordinance',
      legalBasis: null,
    },
    notes: ['제한적 개발 허용'],
  },
}

/**
 * Get building regulations for a zoning code
 */
export function getRegulations(zoningCode: ZoningCode): BuildingRegulations {
  return SEOUL_REGULATIONS[zoningCode]
}

/**
 * Calculate maximum gross floor area (GFA)
 * 최대 연면적 계산
 *
 * @param lotArea - Lot area in m²
 * @param zoningCode - Zoning code
 * @returns Maximum GFA in m²
 */
export function calculateMaxGFA(lotArea: number, zoningCode: ZoningCode): number {
  const regulations = SEOUL_REGULATIONS[zoningCode]
  return lotArea * (regulations.far.seoulMax / 100)
}

/**
 * Calculate maximum building coverage (footprint)
 * 최대 건축면적 계산
 *
 * @param lotArea - Lot area in m²
 * @param zoningCode - Zoning code
 * @returns Maximum building footprint in m²
 */
export function calculateMaxBuildingCoverage(
  lotArea: number,
  zoningCode: ZoningCode
): number {
  const regulations = SEOUL_REGULATIONS[zoningCode]
  return lotArea * (regulations.bcr.seoulMax / 100)
}

/**
 * Estimate maximum floors based on FAR and BCR
 * FAR/BCR 기반 최대 층수 추정
 *
 * @param zoningCode - Zoning code
 * @param floorHeight - Average floor height in meters (default 3.3m)
 * @returns Estimated maximum floors
 */
export function estimateMaxFloors(
  zoningCode: ZoningCode,
  _floorHeight: number = 3.3
): number {
  const regulations = SEOUL_REGULATIONS[zoningCode]

  // If there's a floor limit, use it
  if (regulations.height.maxFloors !== null) {
    return regulations.height.maxFloors
  }

  // Otherwise estimate from FAR/BCR ratio
  // Note: _floorHeight reserved for future height-based calculation
  const farToBcrRatio = regulations.far.typical / regulations.bcr.typical
  return Math.ceil(farToBcrRatio)
}

/**
 * FAR/BCR bonus incentive types
 * 용적률/건폐율 인센티브 유형
 */
export type IncentiveType =
  | 'PUBLIC_FACILITY' // 공공시설 기부채납
  | 'AFFORDABLE_HOUSING' // 임대주택 건설
  | 'GREEN_BUILDING' // 친환경 건축물
  | 'TRANSIT_ORIENTED' // 역세권 개발
  | 'URBAN_REGENERATION' // 도시재생
  | 'CULTURAL_FACILITY' // 문화시설 설치

/**
 * Get potential FAR bonus (indicative only)
 * Note: Actual bonuses require detailed review of applicable programs
 */
export function getIndicativeFARBonus(
  _zoningCode: ZoningCode,
  incentiveTypes: IncentiveType[]
): { bonusPercent: number; disclaimer: string } {
  // Note: _zoningCode reserved for zone-specific bonus caps in future
  // This is highly simplified - actual bonus calculations are complex
  let totalBonus = 0

  incentiveTypes.forEach((type) => {
    switch (type) {
      case 'PUBLIC_FACILITY':
        totalBonus += 10
        break
      case 'AFFORDABLE_HOUSING':
        totalBonus += 15
        break
      case 'GREEN_BUILDING':
        totalBonus += 5
        break
      case 'TRANSIT_ORIENTED':
        totalBonus += 20
        break
      case 'URBAN_REGENERATION':
        totalBonus += 15
        break
      case 'CULTURAL_FACILITY':
        totalBonus += 5
        break
    }
  })

  // Cap at reasonable maximum
  const cappedBonus = Math.min(totalBonus, 50)

  return {
    bonusPercent: cappedBonus,
    disclaimer:
      '인센티브 적용은 개별 사업 검토 필요. 본 수치는 참고용입니다.',
  }
}
