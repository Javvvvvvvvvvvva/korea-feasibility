/**
 * Korea Address Resolution
 * 한국 주소 해석 모듈
 *
 * Facade over city-specific adapters.
 * Currently supports: Seoul (서울특별시)
 */

import { seoulAdapter } from './seoul'
import type { ResolvedAddressResult } from '../../domain/korea/cityAdapter'

export type { ResolvedAddressResult }

/**
 * Legacy interface for backward compatibility
 */
export interface ResolvedAddress {
  original: string
  normalized: string
  coordinates: {
    lat: number
    lng: number
  }
  components: {
    sido: string
    sigungu: string
    dong: string
    jibun: string
  }
}

/**
 * Resolve Korean address to coordinates and normalized form
 * @param address - Korean address string
 */
export async function resolveAddress(address: string): Promise<ResolvedAddress> {
  // Use Seoul adapter
  const result = await seoulAdapter.resolveAddress(address)

  if (!result.success) {
    throw new Error(result.error || '주소를 해석할 수 없습니다.')
  }

  // Convert to legacy format for backward compatibility
  const coords = result.coordinates || [126.978, 37.5665]
  const jibun = result.jibunAddress

  return {
    original: result.input,
    normalized: result.normalized || result.input,
    coordinates: {
      lat: coords[1],
      lng: coords[0],
    },
    components: {
      sido: jibun?.sido || '서울특별시',
      sigungu: jibun?.sigungu || '',
      dong: jibun?.eupmyeondong || '',
      jibun: jibun ? `${jibun.bonbun}${jibun.bubun ? '-' + jibun.bubun : ''}` : '',
    },
  }
}

/**
 * Get the underlying resolved address result (new format)
 */
export async function resolveAddressV2(address: string): Promise<ResolvedAddressResult> {
  return seoulAdapter.resolveAddress(address)
}
