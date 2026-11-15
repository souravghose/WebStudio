// Types for "emmet": the package ships them, but its package.json "exports" hides them from TypeScript.
declare module 'emmet' {
  export interface EmmetOptions {
    'output.field'?: (index: number, placeholder: string) => string;
    [key: string]: unknown;
  }
  export interface UserConfig {
    type?: 'markup' | 'stylesheet';
    syntax?: string;
    options?: EmmetOptions;
    [key: string]: unknown;
  }
  export default function expand(abbr: string, config?: UserConfig): string;
}
