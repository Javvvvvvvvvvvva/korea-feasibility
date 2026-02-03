/**
 * Korea Parcel Data Fetcher
 * 한국 필지 정보 조회 모듈
 *
 * Facade over city-specific adapters.
 * Currently supports: Seoul (서울특별시)
 */

import type { Parcel, ParcelGeometry } from '../../types'
import type { ResolvedAddress } from './addressResolver'
import { seoulAdapter } from './seoul'
import type { KoreaParcel } from '../../domain/korea/parcel'
import { formatJibunAddress } from '../../domain/korea/parcel'

/**
 * Fetch parcel information for a resolved address
 * Returns legacy Parcel type for backward compatibility
 */
export async function fetchParcel(address: ResolvedAddress): Promise<Parcel> {
  // Create coordinates array for adapter
  const coords: [number, number] = [address.coordinates.lng, address.coordinates.lat]

  // First resolve address through adapter to get full result
  const addressResult = await seoulAdapter.resolveAddress(address.original)

  // Fetch parcel using adapter
  const result = await seoulAdapter.fetchParcel(
    addressResult.success ? addressResult : coords
  )

  if (!result.success || !result.parcel) {
    throw new Error(result.error || '필지 정보를 가져올 수 없습니다.')
  }

  // Convert to legacy format
  return convertToLegacyParcel(result.parcel)
}

/**
 * Fetch parcel using new domain types
 */
export async function fetchParcelV2(
  coordinates: [number, number]
): Promise<KoreaParcel | null> {
  const result = await seoulAdapter.fetchParcel(coordinates)
  return result.success ? result.parcel || null : null
}

/**
 * Convert KoreaParcel to legacy Parcel type
 */
function convertToLegacyParcel(parcel: KoreaParcel): Parcel {
  const geometry: ParcelGeometry = {
    type: 'Polygon',
    coordinates: parcel.geometry.coordinates as number[][][],
  }

  return {
    pnu: parcel.pnu.full,
    address: {
      full: formatJibunAddress(parcel.jibunAddress),
      sido: parcel.jibunAddress.sido,
      sigungu: parcel.jibunAddress.sigungu,
      dong: parcel.jibunAddress.eupmyeondong,
      jibun: `${parcel.jibunAddress.bonbun}${
        parcel.jibunAddress.bubun ? '-' + parcel.jibunAddress.bubun : ''
      }`,
    },
    geometry,
    area: parcel.area,
  }
}

/**
 * Get raw KoreaParcel from adapter
 */
export async function fetchKoreaParcel(
  address: ResolvedAddress
): Promise<KoreaParcel> {
  const coords: [number, number] = [address.coordinates.lng, address.coordinates.lat]
  const addressResult = await seoulAdapter.resolveAddress(address.original)
  const result = await seoulAdapter.fetchParcel(
    addressResult.success ? addressResult : coords
  )

  if (!result.success || !result.parcel) {
    throw new Error(result.error || '필지 정보를 가져올 수 없습니다.')
  }

  return result.parcel
}
