import type { EditorLang } from './paths';

type Parser = 'html' | 'css' | 'babel' | 'json' | 'markdown' | 'typescript';

const PARSERS: Partial<Record<EditorLang, Parser>> = {
  html: 'html',
  css: 'css',
  javascript: 'babel',
  json: 'json',
  markdown: 'markdown',
};

export const canFormat = (lang: EditorLang) => lang in PARSERS;

/** Format source with Prettier (loaded lazily so it stays out of the initial bundle). */
export async function formatSource(source: string, lang: EditorLang, tabSize = 2): Promise<string> {
  const parser = PARSERS[lang];
  if (!parser) throw new Error(`No formatter available for ${lang}`);
  const [prettier, babel, estree, html, postcss, markdown] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/babel'),
    import('prettier/plugins/estree'),
    import('prettier/plugins/html'),
    import('prettier/plugins/postcss'),
    import('prettier/plugins/markdown'),
  ]);
  return prettier.format(source, {
    parser,
    plugins: [babel, estree, html, postcss, markdown],
    tabWidth: tabSize,
    printWidth: 100,
    singleQuote: lang === 'javascript',
  });
}
