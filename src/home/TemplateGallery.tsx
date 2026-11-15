import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { TemplateThumb } from './TemplateThumb';
import { EDITOR_HREF, storeIntent } from './launch';

// Each id is one of the editor's real starter templates (src/lib/templates.ts).
const GALLERY = [
  { id: 'portfolio', title: 'Portfolio Website', description: 'Showcase your work with filterable projects, a theme switch and a contact form.' },
  { id: 'landing', title: 'Landing Page', description: 'A conversion-focused page with a pricing toggle, FAQ and email sign-up.' },
  { id: 'dashboard', title: 'SaaS Dashboard', description: 'KPI cards, a canvas chart and a searchable, sortable orders table.' },
  { id: 'ecommerce', title: 'E-commerce Homepage', description: 'A storefront with category filters, sorting and a working cart drawer.' },
];

export function TemplateGallery() {
  return (
    <section id="templates" className="xd-section xd-band">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="xd-eyebrow">Templates</span>
          <h2 className="xd-h2">Start with an idea. Finish with a website.</h2>
          <p className="xd-lead">Every template is a real, editable HTML, CSS and JavaScript project. Pick one and make it yours.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {GALLERY.map((t, i) => (
            <Reveal key={t.id} delay={(i % 2) * 90}>
              <article className="xd-card xd-lift">
                <TemplateThumb templateId={t.id} title={t.title} />
                <div className="mt-5 flex flex-1 flex-col">
                  <h3 className="text-xl font-bold tracking-tight">{t.title}</h3>
                  <p className="xd-muted mt-2 flex-1 text-[15px] leading-relaxed">{t.description}</p>
                  <a
                    href={EDITOR_HREF}
                    onClick={() => storeIntent({ kind: 'template', id: t.id })}
                    className="xd-btn xd-btn-primary xd-btn-sm mt-5 self-start"
                    aria-label={`Use the ${t.title} template`}
                  >
                    Use Template <ArrowRight size={16} className="xd-arrow" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
