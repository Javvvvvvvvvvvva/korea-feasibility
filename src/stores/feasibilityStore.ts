import { create } from 'zustand'
import type {
  FeasibilityStatus,
  Parcel,
  ZoningInfo,
  MassingResult,
  ConfidenceReport,
} from '../types'
import { resolveAddress } from '../adapters/korea/addressResolver'
import { fetchParcel } from '../adapters/korea/parcelFetcher'
import {
  resolveZoning,
  resolveZoningWithOverride,
  getAvailableZoningTypes,
  ZoningResolutionError,
} from '../adapters/korea/zoningResolver'
import { calculateMassing } from '../domain/massingCalculator'
import { generateConfidenceReport } from '../domain/confidenceReporter'
import type { ZoningCode } from '../domain/korea/zoning'

interface FeasibilityStore {
  // State
  status: FeasibilityStatus
  address: string
  parcel: Parcel | null
  zoning: ZoningInfo | null
  massing: MassingResult | null
  confidence: ConfidenceReport | null
  error: string | null

  // Manual zoning override
  manualZoningCode: ZoningCode | null
  availableZoningTypes: Array<{ code: ZoningCode; name: string; category: string }>
  zoningRequiresManualSelection: boolean // True when API fails and user must select

  // Actions
  setAddress: (address: string) => void
  analyze: (address: string) => Promise<void>
  setManualZoning: (code: ZoningCode | null) => void
  recalculateWithZoning: (code: ZoningCode) => Promise<void>
  reset: () => void
}

const initialState = {
  status: 'idle' as FeasibilityStatus,
  address: '',
  parcel: null,
  zoning: null,
  massing: null,
  confidence: null,
  error: null,
  manualZoningCode: null,
  availableZoningTypes: getAvailableZoningTypes(),
  zoningRequiresManualSelection: false,
}

export const useFeasibilityStore = create<FeasibilityStore>((set, get) => ({
  ...initialState,

  setAddress: (address: string) => {
    set({ address })
  },

  analyze: async (address: string) => {
    set({ ...initialState, address, status: 'resolving_address', availableZoningTypes: getAvailableZoningTypes() })

    try {
      // Step 1: Resolve address to coordinates
      set({ status: 'resolving_address' })
      const resolvedAddress = await resolveAddress(address)

      // Step 2: Fetch parcel information
      set({ status: 'fetching_parcel' })
      const parcel = await fetchParcel(resolvedAddress)
      set({ parcel })

      // Step 3: Resolve zoning information
      set({ status: 'resolving_zoning' })
      const { manualZoningCode } = get()

      let zoning: ZoningInfo
      try {
        zoning = manualZoningCode
          ? await resolveZoningWithOverride(parcel, manualZoningCode)
          : await resolveZoning(parcel)
        set({ zoning, zoningRequiresManualSelection: false })
      } catch (zoningError) {
        if (
          zoningError instanceof ZoningResolutionError &&
          zoningError.requiresManualOverride
        ) {
          // Zoning API failed - prompt user to select manually
          set({
            status: 'resolving_zoning',
            zoningRequiresManualSelection: true,
            error: zoningError.message,
          })
          // Don't throw - let UI handle manual selection
          return
        }
        throw zoningError
      }

      // Step 4: Calculate massing
      set({ status: 'calculating_massing' })
      const massing = calculateMassing(parcel, zoning)
      set({ massing })

      // Step 5: Generate confidence report
      const confidence = generateConfidenceReport(parcel, zoning, massing)
      set({ confidence, status: 'complete' })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      set({ status: 'error', error: message })
    }
  },

  setManualZoning: (code: ZoningCode | null) => {
    set({ manualZoningCode: code })
  },

  recalculateWithZoning: async (code: ZoningCode) => {
    const { parcel } = get()

    if (!parcel) {
      set({ error: '필지 정보가 없습니다. 먼저 주소를 분석하세요.' })
      return
    }

    try {
      set({ status: 'resolving_zoning', manualZoningCode: code })

      // Resolve with manual override
      const zoning = await resolveZoningWithOverride(parcel, code)
      set({ zoning })

      // Recalculate massing
      set({ status: 'calculating_massing' })
      const massing = calculateMassing(parcel, zoning)
      set({ massing })

      // Regenerate confidence report
      const confidence = generateConfidenceReport(parcel, zoning, massing)
      set({ confidence, status: 'complete' })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '용도지역 변경 중 오류가 발생했습니다.'
      set({ status: 'error', error: message })
    }
  },

  reset: () => {
    set({ ...initialState, availableZoningTypes: getAvailableZoningTypes() })
  },
}))
