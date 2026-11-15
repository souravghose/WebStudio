import { LanguageCard } from './LanguageCard';
import { Reveal } from './Reveal';

// Only environments the editor genuinely supports (HTML/CSS/JS projects with a live preview).
const ENVIRONMENTS = [
  { key: 'html' as const, name: 'HTML', badge: 'HTML', gradient: 'linear-gradient(135deg,#f97316,#ef4444)', description: 'Structure pages with semantic markup and see them render the moment you type.' },
  { key: 'css' as const, name: 'CSS', badge: 'CSS', gradient: 'linear-gradient(135deg,#38bdf8,#6366f1)', description: 'Style layouts, transitions and responsive designs with instant visual feedback.' },
  { key: 'js' as const, name: 'JavaScript', badge: 'JS', gradient: 'linear-gradient(135deg,#facc15,#f59e0b)', description: 'Add interactivity and test ideas with a console and REPL right beside your page.' },
  { key: 'website' as const, name: 'Full Website', badge: '{ }', gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)', description: 'A ready-to-run HTML, CSS and JS starter, wired together and waiting for you.' },
];

export function QuickStartSection() {
  return (
    <section id="quickstart" className="xd-section">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="xd-eyebrow">Quick start</span>
          <h2 className="xd-h2">Where do you want to start?</h2>
          <p className="xd-lead">Choose your environment and start building.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ENVIRONMENTS.map((env, i) => (
            <Reveal key={env.key} delay={i * 80}>
              <LanguageCard name={env.name} badge={env.badge} gradient={env.gradient} description={env.description} intent={{ kind: 'start', key: env.key }} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
