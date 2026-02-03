/**
 * Korea Adapters - Seoul v1
 *
 * This module exports all Korea-specific adapters for:
 * - Address resolution
 * - Parcel data fetching
 * - Zoning resolution
 *
 * NO US ADAPTERS - KOREA ONLY
 */

// Legacy exports (backward compatibility)
export { resolveAddress, resolveAddressV2 } from './addressResolver'
export type { ResolvedAddress, ResolvedAddressResult } from './addressResolver'

export { fetchParcel, fetchParcelV2, fetchKoreaParcel } from './parcelFetcher'

export {
  resolveZoning,
  getAvailableZoningTypes,
  getZoningRegulations,
  resolveZoningWithOverride,
} from './zoningResolver'

// Seoul adapter (new)
export { seoulAdapter, SeoulCityAdapter } from './seoul'
