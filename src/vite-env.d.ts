/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** Opcional. Site público onde se pede acesso; por omissão https://domios.pt. */
  readonly VITE_SITE_URL?: string;
  /** Opcional (só o site). Onde vive a app; por omissão https://app.domios.pt. */
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
