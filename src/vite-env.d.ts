/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COUNTRY: string
  readonly VITE_CITY: string
  readonly VITE_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
