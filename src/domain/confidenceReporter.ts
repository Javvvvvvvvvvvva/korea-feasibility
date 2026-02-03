/**
 * Confidence Reporter
 * 신뢰도 보고서 생성기
 *
 * Generates transparency report showing:
 * - What is known (확인된 정보)
 * - What is assumed (가정된 정보)
 * - What is missing (누락된 정보)
 *
 * Each item includes legal basis when applicable.
 */

import type {
  Parcel,
  ZoningInfo,
  MassingResult,
  ConfidenceReport,
  ConfidenceItem,
} from '../types'

/**
 * Legal reference constants
 */
const LEGAL_REFS = {
  NATIONAL_PLANNING_ACT: '국토계획법',
  NATIONAL_PLANNING_ACT_FULL: '국토의 계획 및 이용에 관한 법률',
  ENFORCEMENT_DECREE: '국토계획법 시행령',
  SEOUL_ORDINANCE: '서울시 도시계획 조례',
  BUILDING_ACT: '건축법',
  articles: {
    zoning: {
      law: '국토계획법 제36조',
      decree: '국토계획법 시행령 제30조',
    },
    far: {
      law: '국토계획법 제78조',
      decree: '국토계획법 시행령 제85조',
      seoul: '서울시 조례 제55조',
    },
    bcr: {
      law: '국토계획법 제77조',
      decree: '국토계획법 시행령 제84조',
      seoul: '서울시 조례 제54조',
    },
    height: {
      building: '건축법 제60조',
      setback: '건축법 제61조',
    },
  },
}

/**
 * Generate confidence report for the analysis
 */
export function generateConfidenceReport(
  parcel: Parcel,
  zoning: ZoningInfo,
  _massing: MassingResult
): ConfidenceReport {
  const known: ConfidenceItem[] = []
  const assumed: ConfidenceItem[] = []
  const missing: ConfidenceItem[] = []

  // Address and parcel info
  known.push({
    label: '주소',
    value: parcel.address.full,
    source: '사용자 입력',
    dataCategory: 'parcel',
  })

  // Parcel area - in v1, this is simulated
  assumed.push({
    label: '대지면적',
    value: `${parcel.area.toLocaleString()} m²`,
    source: '추정값 (실제 지적도 데이터 필요)',
    dataCategory: 'parcel',
    legalBasis: '공간정보의 구축 및 관리 등에 관한 법률',
  })

  // Zoning
  if (zoning.source.reliability === 'high') {
    known.push({
      label: '용도지역',
      value: zoning.name,
      source: zoning.source.name,
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.NATIONAL_PLANNING_ACT_FULL,
      legalArticle: LEGAL_REFS.articles.zoning.law,
    })
  } else {
    assumed.push({
      label: '용도지역',
      value: zoning.name,
      source: `구역 기반 추정 (${zoning.source.name})`,
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.NATIONAL_PLANNING_ACT_FULL,
      legalArticle: LEGAL_REFS.articles.zoning.law,
    })
  }

  // FAR
  const far = zoning.regulations.far
  const farLegalArticle = far.source === 'ordinance'
    ? LEGAL_REFS.articles.far.seoul
    : LEGAL_REFS.articles.far.decree

  if (far.confidence === 'high') {
    known.push({
      label: '용적률',
      value: `${far.value}%`,
      source: far.legalBasis || LEGAL_REFS.SEOUL_ORDINANCE,
      dataCategory: 'regulation',
      legalBasis: far.source === 'ordinance' ? LEGAL_REFS.SEOUL_ORDINANCE : LEGAL_REFS.ENFORCEMENT_DECREE,
      legalArticle: farLegalArticle,
    })
  } else if (far.confidence === 'medium') {
    assumed.push({
      label: '용적률',
      value: `${far.value}%`,
      source: far.legalBasis || '일반적 기준 적용',
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.SEOUL_ORDINANCE,
      legalArticle: LEGAL_REFS.articles.far.seoul,
    })
  } else {
    missing.push({
      label: '용적률',
      value: '확인 필요',
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.NATIONAL_PLANNING_ACT,
      legalArticle: LEGAL_REFS.articles.far.law,
    })
  }

  // BCR
  const bcr = zoning.regulations.bcr
  const bcrLegalArticle = bcr.source === 'ordinance'
    ? LEGAL_REFS.articles.bcr.seoul
    : LEGAL_REFS.articles.bcr.decree

  if (bcr.confidence === 'high') {
    known.push({
      label: '건폐율',
      value: `${bcr.value}%`,
      source: bcr.legalBasis || LEGAL_REFS.SEOUL_ORDINANCE,
      dataCategory: 'regulation',
      legalBasis: bcr.source === 'ordinance' ? LEGAL_REFS.SEOUL_ORDINANCE : LEGAL_REFS.ENFORCEMENT_DECREE,
      legalArticle: bcrLegalArticle,
    })
  } else if (bcr.confidence === 'medium') {
    assumed.push({
      label: '건폐율',
      value: `${bcr.value}%`,
      source: bcr.legalBasis || '일반적 기준 적용',
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.SEOUL_ORDINANCE,
      legalArticle: LEGAL_REFS.articles.bcr.seoul,
    })
  } else {
    missing.push({
      label: '건폐율',
      value: '확인 필요',
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.NATIONAL_PLANNING_ACT,
      legalArticle: LEGAL_REFS.articles.bcr.law,
    })
  }

  // Height limit
  const height = zoning.regulations.heightLimit
  if (height.value !== null && height.confidence !== 'unknown') {
    if (height.confidence === 'high') {
      known.push({
        label: '높이제한',
        value: `${height.value}m`,
        source: height.legalBasis || LEGAL_REFS.BUILDING_ACT,
        dataCategory: 'regulation',
        legalBasis: LEGAL_REFS.BUILDING_ACT,
        legalArticle: LEGAL_REFS.articles.height.building,
      })
    } else {
      assumed.push({
        label: '높이제한',
        value: `${height.value}m`,
        source: height.legalBasis || '용적률 기반 추정',
        dataCategory: 'calculation',
        legalBasis: LEGAL_REFS.BUILDING_ACT,
        legalArticle: LEGAL_REFS.articles.height.building,
      })
    }
  } else {
    missing.push({
      label: '높이제한',
      value: '미확인 (용적률 기반 계산)',
      dataCategory: 'regulation',
      legalBasis: LEGAL_REFS.BUILDING_ACT,
      legalArticle: LEGAL_REFS.articles.height.building,
    })
  }

  // Additional missing items that would need actual data
  missing.push({
    label: '지구단위계획',
    value: '미확인',
    dataCategory: 'overlay',
    legalBasis: LEGAL_REFS.NATIONAL_PLANNING_ACT,
    legalArticle: '국토계획법 제49조',
  })

  missing.push({
    label: '정비구역 지정 여부',
    value: '미확인',
    dataCategory: 'overlay',
    legalBasis: '도시 및 주거환경정비법',
    legalArticle: '도시정비법 제16조',
  })

  missing.push({
    label: '일조권 사선제한',
    value: '미반영',
    dataCategory: 'regulation',
    legalBasis: LEGAL_REFS.BUILDING_ACT,
    legalArticle: LEGAL_REFS.articles.height.setback,
  })

  missing.push({
    label: '도로사선제한',
    value: '미반영',
    dataCategory: 'regulation',
    legalBasis: LEGAL_REFS.BUILDING_ACT,
    legalArticle: LEGAL_REFS.articles.height.building,
  })

  return { known, assumed, missing }
}
