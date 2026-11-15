export type StartKey = 'html' | 'css' | 'js' | 'website';

export interface Starter {
  /** Project name. If a project with this name already exists it is re-opened, not duplicated. */
  name: string;
  /** File to focus in the editor. */
  open: string;
  /** Files that replace the blank template's defaults. Omit to keep the plain blank project. */
  files?: Record<string, string>;
}

const head = (title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="style.css" />
</head>`;

const HTML_PAGE = `${head('HTML Playground')}
<body>
  <header>
    <h1>HTML Playground</h1>
    <p>Edit this markup and watch the preview update as you type.</p>
  </header>

  <main>
    <section>
      <h2>Text and links</h2>
      <p>Paragraphs hold <strong>bold</strong>, <em>italic</em> and <a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank" rel="noopener">links</a>.</p>
    </section>

    <section>
      <h2>Lists</h2>
      <ul>
        <li>Unordered item</li>
        <li>Another item</li>
      </ul>
      <ol>
        <li>First step</li>
        <li>Second step</li>
      </ol>
    </section>

    <section>
      <h2>A simple form</h2>
      <form id="demo-form">
        <label>Name <input id="name" placeholder="Ada Lovelace" /></label>
        <label>Favourite language
          <select id="lang"><option>HTML</option><option>CSS</option><option>JavaScript</option></select>
        </label>
        <button type="submit">Send</button>
      </form>
    </section>

    <section>
      <h2>A table</h2>
      <table>
        <thead><tr><th>Tag</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td>&lt;header&gt;</td><td>Introductory content</td></tr>
          <tr><td>&lt;main&gt;</td><td>The page's main content</td></tr>
          <tr><td>&lt;section&gt;</td><td>A themed group of content</td></tr>
        </tbody>
      </table>
    </section>
  </main>

  <script src="script.js"></script>
</body>
</html>
`;

const HTML_CSS = `body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; }
header { padding: 40px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
header h1 { margin: 0 0 6px; }
header p { margin: 0; opacity: 0.9; }
main { max-width: 720px; margin: 0 auto; padding: 24px; display: grid; gap: 16px; }
section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; }
h2 { margin-top: 0; font-size: 18px; }
form { display: grid; gap: 10px; max-width: 360px; }
input, select { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
table { border-collapse: collapse; width: 100%; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
`;

const HTML_JS = `// Log the form values instead of reloading the page.
document.getElementById('demo-form').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('Form submitted:', {
    name: document.getElementById('name').value,
    language: document.getElementById('lang').value,
  });
});
`;

const CSS_PAGE = `${head('CSS Playground')}
<body>
  <main class="stage">
    <article class="card">
      <div class="avatar">XD</div>
      <h1>CSS Playground</h1>
      <p>Open <code>style.css</code> and change the colours, spacing, radius and animation.</p>
      <div class="actions">
        <button class="btn btn-primary">Primary</button>
        <button class="btn">Secondary</button>
      </div>
    </article>

    <section class="grid">
      <div class="tile">1</div>
      <div class="tile">2</div>
      <div class="tile">3</div>
      <div class="tile">4</div>
    </section>
  </main>
</body>
</html>
`;

const CSS_CSS = `/* Try editing any value and watch the preview update. */

:root {
  --accent: #6366f1;
  --accent-2: #8b5cf6;
  --radius: 16px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

.stage { max-width: 560px; margin: 0 auto; padding: 40px 20px; display: grid; gap: 24px; }

.card {
  padding: 28px;
  border-radius: var(--radius);
  background: #1e293b;
  border: 1px solid #334155;
  text-align: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px #0008; }

.avatar {
  width: 64px; height: 64px; margin: 0 auto 14px;
  display: grid; place-items: center;
  border-radius: 50%;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}

h1 { margin: 0 0 8px; }
p { color: #94a3b8; }
code { background: #0f172a; padding: 2px 6px; border-radius: 6px; }

.actions { display: flex; gap: 10px; justify-content: center; margin-top: 18px; }
.btn {
  padding: 10px 18px; border-radius: 10px; border: 1px solid #475569;
  background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer;
}
.btn-primary { background: var(--accent); border-color: var(--accent); }
.btn:hover { filter: brightness(1.15); }

/* A responsive grid: try changing minmax(110px, 1fr) */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px; }
.tile {
  aspect-ratio: 1; display: grid; place-items: center;
  border-radius: 12px; font-size: 28px; font-weight: 800;
  background: #1e293b; border: 1px solid #334155;
}
.tile:nth-child(odd) { color: var(--accent); }
.tile:nth-child(even) { color: var(--accent-2); }
`;

const JS_PAGE = `${head('JavaScript Playground')}
<body>
  <main>
    <h1>JavaScript Playground</h1>
    <p>Open <code>script.js</code>. Results appear here and in the Console below.</p>

    <div class="row">
      <button id="inc">Count: <span id="count">0</span></button>
      <button id="shuffle">Shuffle list</button>
    </div>

    <ul id="list"></ul>
  </main>
  <script src="script.js"></script>
</body>
</html>
`;

const JS_CSS = `body { margin: 0; font-family: system-ui, sans-serif; background: #f8fafc; color: #1f2937; }
main { max-width: 520px; margin: 0 auto; padding: 36px 20px; }
code { background: #e2e8f0; padding: 2px 6px; border-radius: 6px; }
.row { display: flex; gap: 10px; margin: 18px 0; }
button { padding: 10px 16px; border: 0; border-radius: 10px; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
button:active { transform: scale(0.97); }
ul { list-style: none; padding: 0; display: grid; gap: 8px; }
li { padding: 10px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
`;

const JS_JS = `// 1. Variables and console output
const greeting = 'Hello from XDevCodeStudio!';
console.log(greeting);

// 2. Reacting to clicks
let count = 0;
const countEl = document.getElementById('count');
document.getElementById('inc').addEventListener('click', () => {
  count += 1;
  countEl.textContent = count;
  console.log('Count is now', count);
});

// 3. Working with arrays
let languages = ['HTML', 'CSS', 'JavaScript', 'JSON'];
const list = document.getElementById('list');

function render() {
  list.innerHTML = '';
  languages.forEach((name, index) => {
    const li = document.createElement('li');
    li.textContent = (index + 1) + '. ' + name;
    list.appendChild(li);
  });
}

document.getElementById('shuffle').addEventListener('click', () => {
  languages = [...languages].sort(() => Math.random() - 0.5);
  render();
  console.log('Shuffled:', languages);
});

render();

// 4. Try the console REPL below: type  languages.length  and press Enter.
`;

export const STARTERS: Record<StartKey, Starter> = {
  html: { name: 'HTML Playground', open: 'index.html', files: { 'index.html': HTML_PAGE, 'style.css': HTML_CSS, 'script.js': HTML_JS } },
  css: { name: 'CSS Playground', open: 'style.css', files: { 'index.html': CSS_PAGE, 'style.css': CSS_CSS, 'script.js': '// This playground is about CSS — add JavaScript here if you like.\n' } },
  js: { name: 'JavaScript Playground', open: 'script.js', files: { 'index.html': JS_PAGE, 'style.css': JS_CSS, 'script.js': JS_JS } },
  website: { name: 'Website Starter', open: 'index.html' },
};
