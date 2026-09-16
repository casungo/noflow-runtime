/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLICY_MODE?: 'mock' | 'jev'
  readonly VITE_SEMANTIC_POLICY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
