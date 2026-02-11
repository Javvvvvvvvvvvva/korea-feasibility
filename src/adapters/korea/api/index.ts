/**
 * Korea API Adapters
 * 한국 공공데이터 API 어댑터
 */

export {
  VWorldClient,
  getVWorldClient,
  isVWorldAvailable,
  type VWorldConfig,
  type VWorldParcelResult,
  type VWorldZoningResult,
} from './vworldClient'

export {
  DataGoKrClient,
  getDataGoKrClient,
  isDataGoKrAvailable,
  type DataGoKrConfig,
  type DataGoKrParcelResult,
  type DataGoKrRegulationResult,
  type ParsedRegulation,
  type DataSourceStatus,
  type DataSourceHealth,
} from './dataGoKrClient'

export {
  validatePNU,
  validateVWorldResponse,
  validateDataGoKrWFSResponse,
  validateLuArinfoResponse,
  PNUSchema,
  VWorldResponseSchema,
  DataGoKrWFSResponseSchema,
  LuArinfoResponseSchema,
  type ValidatedPNU,
  type ValidatedVWorldResponse,
  type ValidatedDataGoKrWFSResponse,
  type ValidatedLuArinfoResponse,
  type LandUseRegulationItem,
} from './schemas'
