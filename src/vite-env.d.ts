/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_FORCE_DSE_MARKET_OPEN?: string
  readonly VITE_MARKET_DATA_MODE?: string
  readonly VITE_DSE_MARKET_DATA_ENDPOINT?: string
  readonly VITE_DSE_MARKET_DATA_API_KEY?: string
  readonly VITE_REQUIRE_EMAIL_CONFIRMATION?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
