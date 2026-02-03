/**
 * Korea Zoning Domain Model
 * 한국 용도지역 도메인 모델
 *
 * Legal Basis:
 * - 국토의 계획 및 이용에 관한 법률 (국토계획법)
 * - 국토의 계획 및 이용에 관한 법률 시행령
 * - 서울특별시 도시계획 조례
 *
 * Reference: https://www.law.go.kr
 */

/**
 * 용도지역 대분류 (Major Zoning Categories)
 * Based on 국토계획법 제36조
 */
export type ZoningMajorCategory =
  | 'URBAN' // 도시지역
  | 'MANAGEMENT' // 관리지역
  | 'AGRICULTURAL' // 농림지역
  | 'NATURAL_ENVIRONMENT' // 자연환경보전지역

/**
 * 도시지역 세분류 (Urban Area Sub-categories)
 * Based on 국토계획법 제36조제1항
 */
export type UrbanZoneType =
  | 'RESIDENTIAL' // 주거지역
  | 'COMMERCIAL' // 상업지역
  | 'INDUSTRIAL' // 공업지역
  | 'GREEN' // 녹지지역

/**
 * 주거지역 세분류 (Residential Zone Types)
 * Based on 국토계획법 시행령 제30조
 */
export type ResidentialZoneSubtype =
  | 'EXCLUSIVE_1' // 제1종전용주거지역: 단독주택 중심 양호한 주거환경
  | 'EXCLUSIVE_2' // 제2종전용주거지역: 공동주택 중심 양호한 주거환경
  | 'GENERAL_1' // 제1종일반주거지역: 저층주택 중심 편리한 주거환경
  | 'GENERAL_2' // 제2종일반주거지역: 중층주택 중심 편리한 주거환경
  | 'GENERAL_3' // 제3종일반주거지역: 중고층주택 중심 편리한 주거환경
  | 'SEMI_RESIDENTIAL' // 준주거지역: 주거기능 + 상업/업무 보완

/**
 * 상업지역 세분류 (Commercial Zone Types)
 * Based on 국토계획법 시행령 제30조
 */
export type CommercialZoneSubtype =
  | 'CENTRAL' // 중심상업지역: 도심/부도심 상업/업무
  | 'GENERAL' // 일반상업지역: 일반 상업/업무
  | 'NEIGHBORHOOD' // 근린상업지역: 근린지역 일용품/서비스
  | 'DISTRIBUTION' // 유통상업지역: 도시 내/지역 간 유통

/**
 * 공업지역 세분류 (Industrial Zone Types)
 * Based on 국토계획법 시행령 제30조
 */
export type IndustrialZoneSubtype =
  | 'EXCLUSIVE' // 전용공업지역: 중화학공업, 공해성 공업
  | 'GENERAL' // 일반공업지역: 환경 저해 우려 없는 공업
  | 'SEMI_INDUSTRIAL' // 준공업지역: 경공업 + 주거/상업/업무 보완

/**
 * 녹지지역 세분류 (Green Zone Types)
 * Based on 국토계획법 시행령 제30조
 */
export type GreenZoneSubtype =
  | 'CONSERVATION' // 보전녹지지역: 자연환경/경관/산림/녹지공간 보전
  | 'PRODUCTION' // 생산녹지지역: 농업적 생산 위한 녹지
  | 'NATURAL' // 자연녹지지역: 보전 필요, 제한적 개발 허용

/**
 * Complete Zoning Code
 * Unique identifier for each zoning type
 */
export type ZoningCode =
  // Residential
  | 'R1E' // 제1종전용주거지역
  | 'R2E' // 제2종전용주거지역
  | 'R1G' // 제1종일반주거지역
  | 'R2G' // 제2종일반주거지역
  | 'R3G' // 제3종일반주거지역
  | 'RSR' // 준주거지역
  // Commercial
  | 'CC' // 중심상업지역
  | 'CG' // 일반상업지역
  | 'CN' // 근린상업지역
  | 'CD' // 유통상업지역
  // Industrial
  | 'IE' // 전용공업지역
  | 'IG' // 일반공업지역
  | 'ISI' // 준공업지역
  // Green
  | 'GC' // 보전녹지지역
  | 'GP' // 생산녹지지역
  | 'GN' // 자연녹지지역

/**
 * Zoning Definition
 * Complete definition of a zoning type including all regulatory parameters
 */
export interface ZoningDefinition {
  code: ZoningCode
  nameKorean: string
  nameEnglish: string
  majorCategory: ZoningMajorCategory
  urbanType?: UrbanZoneType
  description: string
  purpose: string
  legalBasis: {
    law: string
    article: string
  }
}

/**
 * All Korea Zoning Definitions
 * Reference data for all standard zoning types
 */
export const ZONING_DEFINITIONS: Record<ZoningCode, ZoningDefinition> = {
  // Residential Zones
  R1E: {
    code: 'R1E',
    nameKorean: '제1종전용주거지역',
    nameEnglish: 'Class 1 Exclusive Residential',
    majorCategory: 'URBAN',
    urbanType: 'RESIDENTIAL',
    description: '단독주택 중심의 양호한 주거환경을 보호하기 위하여 필요한 지역',
    purpose: '저밀도 단독주택 주거환경 보전',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제1호가목',
    },
  },
  R2E: {
    code: 'R2E',
    nameKorean: '제2종전용주거지역',
    nameEnglish: 'Class 2 Exclusive Residential',
    majorCategory: 'URBAN',
    urbanType: 'RESIDENTIAL',
    description: '공동주택 중심의 양호한 주거환경을 보호하기 위하여 필요한 지역',
    purpose: '저밀도 공동주택 주거환경 보전',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제1호나목',
    },
  },
  R1G: {
    code: 'R1G',
    nameKorean: '제1종일반주거지역',
    nameEnglish: 'Class 1 General Residential',
    majorCategory: 'URBAN',
    urbanType: 'RESIDENTIAL',
    description: '저층주택을 중심으로 편리한 주거환경을 조성하기 위하여 필요한 지역',
    purpose: '저층 주거환경 조성',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제1호다목',
    },
  },
  R2G: {
    code: 'R2G',
    nameKorean: '제2종일반주거지역',
    nameEnglish: 'Class 2 General Residential',
    majorCategory: 'URBAN',
    urbanType: 'RESIDENTIAL',
    description: '중층주택을 중심으로 편리한 주거환경을 조성하기 위하여 필요한 지역',
    purpose: '중층 주거환경 조성',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제1호라목',
    },
  },
  R3G: {
    code: 'R3G',
    nameKorean: '제3종일반주거지역',
    nameEnglish: 'Class 3 General Residential',
    majorCategory: 'URBAN',
    urbanType: 'RESIDENTIAL',
    description: '중고층주택을 중심으로 편리한 주거환경을 조성하기 위하여 필요한 지역',
    purpose: '중고층 주거환경 조성',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제1호마목',
    },
  },
  RSR: {
    code: 'RSR',
    nameKorean: '준주거지역',
    nameEnglish: 'Semi-Residential',
    majorCategory: 'URBAN',
    urbanType: 'RESIDENTIAL',
    description: '주거기능을 위주로 이를 지원하는 일부 상업기능 및 업무기능을 보완하기 위하여 필요한 지역',
    purpose: '주거 + 상업/업무 혼합',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제1호바목',
    },
  },
  // Commercial Zones
  CC: {
    code: 'CC',
    nameKorean: '중심상업지역',
    nameEnglish: 'Central Commercial',
    majorCategory: 'URBAN',
    urbanType: 'COMMERCIAL',
    description: '도심·부도심의 상업기능 및 업무기능의 확충을 위하여 필요한 지역',
    purpose: '도심/부도심 핵심 상업/업무',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제2호가목',
    },
  },
  CG: {
    code: 'CG',
    nameKorean: '일반상업지역',
    nameEnglish: 'General Commercial',
    majorCategory: 'URBAN',
    urbanType: 'COMMERCIAL',
    description: '일반적인 상업기능 및 업무기능을 담당하게 하기 위하여 필요한 지역',
    purpose: '일반 상업/업무',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제2호나목',
    },
  },
  CN: {
    code: 'CN',
    nameKorean: '근린상업지역',
    nameEnglish: 'Neighborhood Commercial',
    majorCategory: 'URBAN',
    urbanType: 'COMMERCIAL',
    description: '근린지역에서의 일용품 및 서비스의 공급을 위하여 필요한 지역',
    purpose: '근린 생활서비스',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제2호다목',
    },
  },
  CD: {
    code: 'CD',
    nameKorean: '유통상업지역',
    nameEnglish: 'Distribution Commercial',
    majorCategory: 'URBAN',
    urbanType: 'COMMERCIAL',
    description: '도시 내 및 지역 간 유통기능의 증진을 위하여 필요한 지역',
    purpose: '유통/물류',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제2호라목',
    },
  },
  // Industrial Zones
  IE: {
    code: 'IE',
    nameKorean: '전용공업지역',
    nameEnglish: 'Exclusive Industrial',
    majorCategory: 'URBAN',
    urbanType: 'INDUSTRIAL',
    description: '주로 중화학공업, 공해성 공업 등을 수용하기 위하여 필요한 지역',
    purpose: '중화학/공해성 공업',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제3호가목',
    },
  },
  IG: {
    code: 'IG',
    nameKorean: '일반공업지역',
    nameEnglish: 'General Industrial',
    majorCategory: 'URBAN',
    urbanType: 'INDUSTRIAL',
    description: '환경을 저해하지 아니하는 공업의 배치를 위하여 필요한 지역',
    purpose: '일반 공업',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제3호나목',
    },
  },
  ISI: {
    code: 'ISI',
    nameKorean: '준공업지역',
    nameEnglish: 'Semi-Industrial',
    majorCategory: 'URBAN',
    urbanType: 'INDUSTRIAL',
    description: '경공업이나 그 밖의 공업을 수용하되, 주거기능·상업기능 및 업무기능의 보완이 필요한 지역',
    purpose: '경공업 + 주거/상업 혼합',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제3호다목',
    },
  },
  // Green Zones
  GC: {
    code: 'GC',
    nameKorean: '보전녹지지역',
    nameEnglish: 'Conservation Green',
    majorCategory: 'URBAN',
    urbanType: 'GREEN',
    description: '도시의 자연환경·경관·산림 및 녹지공간을 보전할 필요가 있는 지역',
    purpose: '자연환경/경관 보전',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제4호가목',
    },
  },
  GP: {
    code: 'GP',
    nameKorean: '생산녹지지역',
    nameEnglish: 'Production Green',
    majorCategory: 'URBAN',
    urbanType: 'GREEN',
    description: '주로 농업적 생산을 위하여 개발을 유보할 필요가 있는 지역',
    purpose: '농업적 생산',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제4호나목',
    },
  },
  GN: {
    code: 'GN',
    nameKorean: '자연녹지지역',
    nameEnglish: 'Natural Green',
    majorCategory: 'URBAN',
    urbanType: 'GREEN',
    description: '도시의 녹지공간의 확보, 도시확산의 방지, 장래 도시용지의 공급 등을 위하여 보전이 필요하나 불가피한 경우에 한하여 제한적인 개발이 허용되는 지역',
    purpose: '녹지 보전 + 제한적 개발',
    legalBasis: {
      law: '국토의 계획 및 이용에 관한 법률 시행령',
      article: '제30조제1항제4호다목',
    },
  },
}

/**
 * Get zoning definition by code
 */
export function getZoningDefinition(code: ZoningCode): ZoningDefinition {
  return ZONING_DEFINITIONS[code]
}

/**
 * Get zoning definition by Korean name
 */
export function getZoningByKoreanName(name: string): ZoningDefinition | undefined {
  return Object.values(ZONING_DEFINITIONS).find(
    (def) => def.nameKorean === name
  )
}

/**
 * Get all zoning codes for a specific urban type
 */
export function getZoningCodesByUrbanType(type: UrbanZoneType): ZoningCode[] {
  return Object.values(ZONING_DEFINITIONS)
    .filter((def) => def.urbanType === type)
    .map((def) => def.code)
}
