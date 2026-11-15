import type { ProjectNode, TemplateDef } from '../types';

import blankHtml from '../templates/blank/index.html?raw';
import blankCss from '../templates/blank/style.css?raw';
import blankJs from '../templates/blank/script.js?raw';
import portfolioHtml from '../templates/portfolio/index.html?raw';
import portfolioCss from '../templates/portfolio/style.css?raw';
import portfolioJs from '../templates/portfolio/script.js?raw';
import landingHtml from '../templates/landing/index.html?raw';
import landingCss from '../templates/landing/style.css?raw';
import landingJs from '../templates/landing/script.js?raw';
import businessHtml from '../templates/business/index.html?raw';
import businessCss from '../templates/business/style.css?raw';
import businessJs from '../templates/business/script.js?raw';
import dashboardHtml from '../templates/dashboard/index.html?raw';
import dashboardCss from '../templates/dashboard/style.css?raw';
import dashboardJs from '../templates/dashboard/script.js?raw';
import loginHtml from '../templates/login/index.html?raw';
import loginCss from '../templates/login/style.css?raw';
import loginJs from '../templates/login/script.js?raw';
import ecommerceHtml from '../templates/ecommerce/index.html?raw';
import ecommerceCss from '../templates/ecommerce/style.css?raw';
import ecommerceJs from '../templates/ecommerce/script.js?raw';
import responsiveHtml from '../templates/responsive/index.html?raw';
import responsiveCss from '../templates/responsive/style.css?raw';
import responsiveJs from '../templates/responsive/script.js?raw';

const readme = (title: string, blurb: string) =>
  `# ${title}\n\n${blurb}\n\n## Files\n\n- \`index.html\` — page markup\n- \`style.css\` — styles\n- \`script.js\` — behaviour\n- \`assets/\` — put images and fonts here and reference them with relative paths, e.g. \`assets/logo.png\`\n\nCreated with WebStudio.\n`;

function make(id: string, name: string, description: string, accent: string, html: string, css: string, js: string): TemplateDef {
  const nodes: ProjectNode[] = [
    { path: 'index.html', type: 'file', content: html },
    { path: 'style.css', type: 'file', content: css },
    { path: 'script.js', type: 'file', content: js },
    { path: 'assets', type: 'folder', content: '' },
    { path: 'README.md', type: 'file', content: readme(name, description) },
  ];
  return { id, name, description, accent, nodes };
}

export const TEMPLATES: TemplateDef[] = [
  make('blank', 'Blank HTML Project', 'A clean starting point with HTML, CSS and JavaScript wired together.', '#6366F1', blankHtml, blankCss, blankJs),
  make('portfolio', 'Portfolio Website', 'Personal portfolio with filterable projects, theme toggle and contact form.', '#8B5CF6', portfolioHtml, portfolioCss, portfolioJs),
  make('landing', 'Landing Page', 'SaaS landing page with pricing toggle, FAQ and email signup.', '#4F46E5', landingHtml, landingCss, landingJs),
  make('business', 'Business Website', 'Corporate site with animated stats, testimonial slider and contact form.', '#12A594', businessHtml, businessCss, businessJs),
  make('dashboard', 'Dashboard UI', 'Admin dashboard with KPI cards, canvas chart and sortable table.', '#0EA5E9', dashboardHtml, dashboardCss, dashboardJs),
  make('login', 'Login Page', 'Sign in / sign up form with validation and password strength meter.', '#A855F7', loginHtml, loginCss, loginJs),
  make('ecommerce', 'E-commerce Homepage', 'Storefront with product filtering, sorting and a working cart drawer.', '#EA580C', ecommerceHtml, ecommerceCss, ecommerceJs),
  make('responsive', 'Responsive Website', 'Layout playground using Grid, Flexbox and breakpoints.', '#E76F51', responsiveHtml, responsiveCss, responsiveJs),
];

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
