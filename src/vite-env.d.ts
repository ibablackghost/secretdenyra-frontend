/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRAPI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'figma:asset/*' {
  const src: string;
  export default src;
}
