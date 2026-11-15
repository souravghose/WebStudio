/**
 * Built-in snippets + user snippets.
 *
 * Users can add or override snippets without touching code: store JSON under localStorage key
 * "webstudio.snippets", e.g.
 *   {"html":[{"prefix":"hero","description":"Hero block","body":"<section class=\"hero\">\n\t$0\n</section>"}]}
 * or call addUserSnippet('css', {...}) from a future "Snippets" settings screen.
 *
 * Bodies use Monaco / VS Code snippet syntax: $1, ${2:placeholder}, ${3|a,b,c|}, $0 (final cursor).
 *
 * Note: `!`, `div`, `a`, `form`, `table`, `ul` etc. are expanded by the real Emmet engine; the HTML
 * snippets below use *different* prefixes (html5, formfull, tablefull …) so nothing is shadowed.
 */

export type SnippetLang = 'html' | 'css' | 'javascript';
/** Where the snippet may appear: 'text' = outside tags, 'block' = inside {}, 'top' = outside {}, 'any'. */
export type SnippetContext = 'text' | 'block' | 'top' | 'any';

export interface SnippetDef {
  prefix: string;
  description: string;
  body: string;
  when?: SnippetContext;
}

export const BUILTIN_SNIPPETS: Record<SnippetLang, SnippetDef[]> = {
  html: [
    {
      prefix: 'html5', description: 'HTML5 boilerplate', when: 'text',
      body: [
        '<!DOCTYPE html>', '<html lang="${1:en}">', '<head>', '\t<meta charset="UTF-8">',
        '\t<meta name="viewport" content="width=device-width, initial-scale=1.0">', '\t<title>${2:Document}</title>',
        '\t<link rel="stylesheet" href="${3:style.css}">', '</head>', '<body>', '\t$0', '\t<script src="${4:script.js}"></script>', '</body>', '</html>',
      ].join('\n'),
    },
    {
      prefix: 'formfull', description: 'Form with labelled fields and submit button', when: 'text',
      body: [
        '<form action="${1:#}" method="${2|post,get|}">', '\t<div class="field">', '\t\t<label for="${3:name}">${4:Name}</label>',
        '\t\t<input type="${5:text}" id="${3:name}" name="${3:name}" required>', '\t</div>', '\t$0', '\t<button type="submit">${6:Submit}</button>', '</form>',
      ].join('\n'),
    },
    {
      prefix: 'tablefull', description: 'Table with head and body', when: 'text',
      body: [
        '<table>', '\t<thead>', '\t\t<tr>', '\t\t\t<th>${1:Heading}</th>', '\t\t\t<th>${2:Heading}</th>', '\t\t</tr>', '\t</thead>',
        '\t<tbody>', '\t\t<tr>', '\t\t\t<td>${3:Cell}</td>', '\t\t\t<td>${4:Cell}</td>', '\t\t</tr>', '\t</tbody>', '</table>',
      ].join('\n'),
    },
    {
      prefix: 'ulist', description: 'Unordered list', when: 'text',
      body: ['<ul>', '\t<li>${1:Item one}</li>', '\t<li>${2:Item two}</li>', '\t<li>${3:Item three}</li>', '</ul>'].join('\n'),
    },
    {
      prefix: 'navbar', description: 'Navigation bar', when: 'text',
      body: [
        '<nav class="${1:navbar}">', '\t<a href="${2:#}" class="brand">${3:Brand}</a>', '\t<ul>',
        '\t\t<li><a href="${4:#}">${5:Home}</a></li>', '\t\t<li><a href="#">${6:About}</a></li>', '\t\t<li><a href="#">${7:Contact}</a></li>', '\t</ul>', '</nav>',
      ].join('\n'),
    },
    {
      prefix: 'card', description: 'Card component', when: 'text',
      body: [
        '<article class="card">', '\t<img src="${1:image.jpg}" alt="${2:}">', '\t<div class="card-body">', '\t\t<h3>${3:Title}</h3>', '\t\t<p>${4:Description}</p>',
        '\t\t<a href="${5:#}" class="btn">${6:Read more}</a>', '\t</div>', '</article>',
      ].join('\n'),
    },
  ],
  css: [
    { prefix: 'flex', description: 'Flexbox layout', when: 'block', body: 'display: flex;\nflex-direction: ${1|row,column,row-reverse,column-reverse|};\njustify-content: ${2|center,flex-start,flex-end,space-between,space-around,space-evenly|};\nalign-items: ${3|center,stretch,flex-start,flex-end,baseline|};\ngap: ${4:1rem};$0' },
    { prefix: 'grid', description: 'CSS Grid layout', when: 'block', body: 'display: grid;\ngrid-template-columns: ${1:repeat(auto-fit, minmax(240px, 1fr))};\ngap: ${2:1rem};$0' },
    { prefix: 'center', description: 'Center content (flex)', when: 'block', body: 'display: flex;\njustify-content: center;\nalign-items: center;$0' },
    { prefix: 'centergrid', description: 'Center content (grid)', when: 'block', body: 'display: grid;\nplace-items: center;$0' },
    {
      prefix: 'reset', description: 'Modern CSS reset', when: 'top',
      body: [
        '*,', '*::before,', '*::after {', '\tbox-sizing: border-box;', '\tmargin: 0;', '\tpadding: 0;', '}', '', 'html {', '\t-webkit-text-size-adjust: 100%;', '}', '',
        'body {', '\tmin-height: 100vh;', '\tline-height: 1.5;', '\t-webkit-font-smoothing: antialiased;', '}', '', 'img,', 'picture,', 'video,', 'canvas,', 'svg {',
        '\tdisplay: block;', '\tmax-width: 100%;', '}', '', 'input,', 'button,', 'textarea,', 'select {', '\tfont: inherit;', '}', '', 'a {', '\tcolor: inherit;', '\ttext-decoration: none;', '}', '$0',
      ].join('\n'),
    },
    { prefix: 'media', description: '@media query', when: 'top', body: '@media (max-width: ${1:768px}) {\n\t${2:.selector} {\n\t\t$0\n\t}\n}' },
    { prefix: 'vars', description: ':root custom properties', when: 'top', body: ':root {\n\t--${1:primary}: ${2:#6366f1};\n\t--${3:radius}: ${4:8px};\n}$0' },
    { prefix: 'transition', description: 'Transition', when: 'block', body: 'transition: ${1:all} ${2:0.3s} ${3|ease,ease-in,ease-out,ease-in-out,linear|};$0' },
  ],
  javascript: [
    { prefix: 'cl', description: 'console.log()', body: 'console.log($1);$0' },
    { prefix: 'af', description: 'Arrow function', body: 'const ${1:name} = (${2:params}) => {\n\t$0\n};' },
    { prefix: 'fn', description: 'Function declaration', body: 'function ${1:name}(${2:params}) {\n\t$0\n}' },
    { prefix: 'fe', description: 'forEach loop', body: '${1:array}.forEach((${2:item}) => {\n\t$0\n});' },
    { prefix: 'qs', description: 'document.querySelector()', body: "document.querySelector('${1:selector}')$0" },
    { prefix: 'qsa', description: 'document.querySelectorAll()', body: "document.querySelectorAll('${1:selector}')$0" },
    { prefix: 'ael', description: 'addEventListener', body: "${1:element}.addEventListener('${2:click}', (${3:e}) => {\n\t$0\n});" },
    { prefix: 'tc', description: 'try / catch', body: 'try {\n\t$1\n} catch (${2:error}) {\n\t$0\n}' },
    { prefix: 'fetchjson', description: 'fetch JSON (async)', body: "const ${1:res} = await fetch('${2:/api}');\nconst ${3:data} = await ${1:res}.json();$0" },
  ],
};

const STORAGE_KEY = 'webstudio.snippets';

export function loadUserSnippets(): Partial<Record<SnippetLang, SnippetDef[]>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<SnippetLang, SnippetDef[]>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function addUserSnippet(lang: SnippetLang, def: SnippetDef): void {
  const all = loadUserSnippets();
  const list = (all[lang] ?? []).filter((s) => s.prefix !== def.prefix);
  list.push(def);
  all[lang] = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable – snippet only lives for this session */
  }
}

/** Built-ins merged with user snippets (a user snippet with the same prefix wins). */
export function snippetsFor(lang: SnippetLang): SnippetDef[] {
  const user = (loadUserSnippets()[lang] ?? []).filter((s) => s && typeof s.prefix === 'string' && typeof s.body === 'string');
  const overridden = new Set(user.map((s) => s.prefix));
  return [...BUILTIN_SNIPPETS[lang].filter((s) => !overridden.has(s.prefix)), ...user];
}
