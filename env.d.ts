/// <reference types="vite/client" />

declare module "*.css";

// Adicione isso apenas para o TypeScript reconhecer a variável, sem o valor:
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}