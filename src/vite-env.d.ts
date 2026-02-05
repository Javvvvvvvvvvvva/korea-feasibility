/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COUNTRY: string
  readonly VITE_CITY: string
  readonly VITE_VERSION: string
  /** VWorld API key for Korean land data */
  readonly VITE_VWORLD_API_KEY?: string
  /** data.go.kr API key for regulations */
  readonly VITE_DATA_GO_KR_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
