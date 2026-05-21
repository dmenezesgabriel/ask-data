declare module '*.yaml?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_RUNTIME_MODE?: 'client-only' | 'client-server';
}
