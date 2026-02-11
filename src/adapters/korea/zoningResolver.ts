/**
 * Korea Zoning Resolution
 * 한국 용도지역 해석 모듈
 *
 * Facade over city-specific adapters.
 * Currently supports: Seoul (서울특별시)
 *
 * Legal Basis:
 * - 국토의 계획 및 이용에 관한 법률 (국토계획법)
 * - 서울특별시 도시계획 조례
 */

import type { Parcel, ZoningInfo, ZoningCategory, ZoningRegulations } from '../../types'
import { seoulAdapter } from './seoul'
import { SEOUL_REGULATIONS } from '../../domain/korea/regulations'
import type { ZoningCode } from '../../domain/korea/zoning'
import { ZONING_DEFINITIONS } from '../../domain/korea/zoning'
import type { KoreaParcel } from '../../domain/korea/parcel'

/**
 * Map height source from new domain to legacy type
 */
function mapHeightSource(
  source: 'ordinance' | 'district_plan' | 'calculated' | 'none'
): 'law' | 'ordinance' | 'assumed' | 'unknown' {
  switch (source) {
    case 'ordinance':
      return 'ordinance'
    case 'district_plan':
      return 'ordinance'
    case 'calculated':
      return 'assumed'
    case 'none':
      return 'unknown'
    default:
      return 'unknown'
  }
}

/**
 * Map ZoningCode to legacy ZoningCategory
 */
const CODE_TO_CATEGORY: Record<ZoningCode, ZoningCategory> = {
  R1E: 'residential',
  R2E: 'residential',
  R1G: 'residential',
  R2G: 'residential',
  R3G: 'residential',
  RSR: 'residential',
  CC: 'commercial',
  CG: 'commercial',
  CN: 'commercial',
  CD: 'commercial',
  IE: 'industrial',
  IG: 'industrial',
  ISI: 'industrial',
  GC: 'green',
  GP: 'green',
  GN: 'green',
}

/**
 * Custom error for zoning resolution failures that require manual override
 */
export class ZoningResolutionError extends Error {
  constructor(
    message: string,
    public readonly requiresManualOverride: boolean = false
  ) {
    super(message)
    this.name = 'ZoningResolutionError'
  }
}

/**
 * Resolve zoning information for a parcel
 * Returns legacy ZoningInfo type for backward compatibility
 */
export async function resolveZoning(parcel: Parcel): Promise<ZoningInfo> {
  // Convert legacy Parcel to KoreaParcel format for adapter
  const koreaParcel = convertToKoreaParcel(parcel)

  // Use Seoul adapter to resolve zoning
  const result = await seoulAdapter.resolveZoning(koreaParcel)

  if (!result.success || !result.zoningCode) {
    throw new ZoningResolutionError(
      result.error || '용도지역을 확인할 수 없습니다. 용도지역을 수동으로 선택해 주세요.',
      true // Indicates manual override is needed
    )
  }

  // Get full regulations
  const regulations = SEOUL_REGULATIONS[result.zoningCode]
  const definition = ZONING_DEFINITIONS[result.zoningCode]

  // Build legacy ZoningInfo
  const zoningRegulations: ZoningRegulations = {
    far: {
      value: regulations.far.typical,
      unit: '%',
      source: 'ordinance',
      confidence: result.confidence === 'high' ? 'high' : 'medium',
      legalBasis: regulations.far.legalBasis,
    },
    bcr: {
      value: regulations.bcr.seoulMax,
      unit: '%',
      source: 'ordinance',
      confidence: 'high',
      legalBasis: regulations.bcr.legalBasis,
    },
    heightLimit: {
      value: regulations.height.maxHeight,
      unit: 'm',
      source: mapHeightSource(regulations.height.source),
      confidence: regulations.height.maxHeight ? 'medium' : 'unknown',
      legalBasis: regulations.height.legalBasis || undefined,
    },
  }

  return {
    code: result.zoningCode,
    name: definition.nameKorean,
    category: CODE_TO_CATEGORY[result.zoningCode],
    regulations: zoningRegulations,
    source: {
      name: `Seoul Zoning (${result.method})`,
      type: result.method === 'api' ? 'api' : 'calculated',
      retrievedAt: new Date(),
      reliability: result.confidence,
    },
  }
}

/**
 * Convert legacy Parcel to KoreaParcel format
 */
function convertToKoreaParcel(parcel: Parcel): KoreaParcel {
  return {
    pnu: {
      full: parcel.pnu,
      sido: parcel.pnu.substring(0, 2),
      sigungu: parcel.pnu.substring(2, 5),
      eupmyeondong: parcel.pnu.substring(5, 8),
      ri: parcel.pnu.substring(8, 10),
      bonbun: parcel.pnu.substring(10, 14),
      bubun: parcel.pnu.substring(14, 18),
      sanType: parcel.pnu[18] as '1' | '2',
    },
    jibunAddress: {
      sido: parcel.address.sido,
      sigungu: parcel.address.sigungu,
      eupmyeondong: parcel.address.dong,
      bonbun: parseInt(parcel.address.jibun.split('-')[0], 10) || 1,
      bubun: parcel.address.jibun.includes('-')
        ? parseInt(parcel.address.jibun.split('-')[1], 10)
        : undefined,
      isSan: false,
    },
    geometry: {
      type: 'Polygon',
      coordinates: parcel.geometry.coordinates as [number, number][][],
    },
    area: parcel.area,
    landUse: {
      category: '대',
    },
    retrievedAt: new Date(),
    dataSource: {
      provider: 'LOCAL_MOCK',
      reliability: 'estimated',
    },
  }
}

/**
 * Get all available zoning types for manual selection
 */
export function getAvailableZoningTypes(): Array<{
  code: ZoningCode
  name: string
  category: ZoningCategory
}> {
  return Object.entries(ZONING_DEFINITIONS).map(([code, def]) => ({
    code: code as ZoningCode,
    name: def.nameKorean,
    category: CODE_TO_CATEGORY[code as ZoningCode],
  }))
}

/**
 * Get regulations for a specific zoning code
 */
export function getZoningRegulations(zoningCode: ZoningCode): ZoningRegulations {
  const regulations = SEOUL_REGULATIONS[zoningCode]

  return {
    far: {
      value: regulations.far.typical,
      unit: '%',
      source: 'ordinance',
      confidence: 'high',
      legalBasis: regulations.far.legalBasis,
    },
    bcr: {
      value: regulations.bcr.seoulMax,
      unit: '%',
      source: 'ordinance',
      confidence: 'high',
      legalBasis: regulations.bcr.legalBasis,
    },
    heightLimit: {
      value: regulations.height.maxHeight,
      unit: 'm',
      source: mapHeightSource(regulations.height.source),
      confidence: regulations.height.maxHeight ? 'medium' : 'unknown',
      legalBasis: regulations.height.legalBasis || undefined,
    },
  }
}

/**
 * Resolve zoning with manual override capability
 */
export async function resolveZoningWithOverride(
  parcel: Parcel,
  manualZoningCode?: ZoningCode
): Promise<ZoningInfo> {
  if (manualZoningCode) {
    // Use manual override
    const definition = ZONING_DEFINITIONS[manualZoningCode]
    const zoningRegulations = getZoningRegulations(manualZoningCode)

    return {
      code: manualZoningCode,
      name: definition.nameKorean,
      category: CODE_TO_CATEGORY[manualZoningCode],
      regulations: zoningRegulations,
      source: {
        name: 'Manual Override',
        type: 'manual',
        retrievedAt: new Date(),
        reliability: 'high',
      },
    }
  }

  // Otherwise use automatic resolution
  return resolveZoning(parcel)
}
