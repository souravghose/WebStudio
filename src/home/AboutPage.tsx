import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, Target } from 'lucide-react';
import './home.css';
import './about.css';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FounderSection } from './FounderSection';
import { Reveal } from './Reveal';
import { EDITOR_HREF } from './launch';
import { SCROLLER_ID } from './scroll';
import { useTheme } from './theme';

export default function AboutPage() {
  const { theme, toggle } = useTheme();
  const scroller = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = 'About — XDevCodeStudio';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div id={SCROLLER_ID} ref={scroller} className="xd-home" data-theme={theme}>
      <Navbar theme={theme} onToggleTheme={toggle} scrolled={scrolled} active="about" page="about" />

      <main>
        {/* ---------- hero ---------- */}
        <section className="xd-hero xa-hero" id="xd-top">
          <div className="xd-hero-grid" aria-hidden="true" />
          <div className="xd-glow a" aria-hidden="true" />
          <div className="xd-glow b" aria-hidden="true" />

          <span className="xa-chip c1" aria-hidden="true"><i>const</i> idea = <b>build</b>();</span>
          <span className="xa-chip c2" aria-hidden="true">&lt;<b>main</b>&gt;&lt;/<b>main</b>&gt;</span>
          <span className="xa-chip c3" aria-hidden="true">.create &#123; <i>color</i>: <b>#6366f1</b>; &#125;</span>
          <span className="xa-chip c4" aria-hidden="true">console.<b>log</b>(&quot;hello&quot;);</span>

          <div className="xa-hero-inner mx-auto max-w-[1180px] px-5 sm:px-8">
            <span className="xd-eyebrow xd-fade-up">About XDevCodeStudio</span>
            <h1 className="xa-h1 xd-fade-up" style={{ '--d': '80ms' } as React.CSSProperties}>
              <span>More than a code editor.</span>
              <span className="xd-gradient-text">A space to create.</span>
            </h1>
            <p className="xa-hero-lead xd-fade-up" style={{ '--d': '180ms' } as React.CSSProperties}>
              XDevCodeStudio was created with a simple idea: make coding more accessible, intuitive and enjoyable. We believe great ideas should have a simple place to grow, experiment and become reality.
            </p>
          </div>
        </section>

        {/* ---------- story ---------- */}
        <section id="story" className="xd-section xd-band">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <div className="xa-story">
              <Reveal className="xa-story-head">
                <span className="xd-eyebrow">Our story</span>
                <h2 className="xd-h2">The idea behind XDevCodeStudio</h2>
                <div className="xa-rule" aria-hidden="true" />
              </Reveal>
              <Reveal delay={90} className="xa-prose">
                <p>XDevCodeStudio started with a passion for technology and the idea of creating a better coding experience directly in the browser.</p>
                <p>The goal is to bring essential development tools together in one simple workspace, where developers, students and curious creators can experiment with code, build websites and bring their ideas to life without unnecessary complexity.</p>
                <p>What started as an idea is growing into a platform focused on simplicity, creativity and accessibility.</p>
              </Reveal>
            </div>
          </div>
        </section>

        <FounderSection />

        {/* ---------- mission & vision ---------- */}
        <section id="mission" className="xd-section xd-band">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <div className="xa-duo">
              <Reveal>
                <div className="xa-panel h-full">
                  <span className="xa-icon" aria-hidden="true"><Target size={26} /></span>
                  <span className="xd-eyebrow mt-6">Our mission</span>
                  <h2>Making coding simpler for everyone.</h2>
                  <p>Our mission is to create an accessible and intuitive development environment that helps people turn ideas into working projects. We want to remove unnecessary friction from the coding experience and make building on the web more enjoyable.</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="xa-panel vision h-full">
                  <span className="xa-icon" aria-hidden="true"><Eye size={26} /></span>
                  <span className="xd-eyebrow mt-6">Our vision</span>
                  <h2>Where we&rsquo;re going</h2>
                  <p>We envision XDevCodeStudio becoming a creative workspace for developers and learners around the world — bringing coding, experimentation and project creation together in one seamless experience.</p>
                  <p>We believe the best tools are the ones that help people focus on what they want to create.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- final CTA ---------- */}
        <section className="xd-section">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <Reveal>
              <div className="xd-cta">
                <h2 className="xd-h2 mx-auto max-w-2xl">Have an idea? <span className="xd-gradient-text">Let&rsquo;s build something.</span></h2>
                <p className="xd-lead mx-auto max-w-xl">Explore XDevCodeStudio and start creating your next project.</p>
                <a href={EDITOR_HREF} className="xd-btn xd-btn-primary mt-8">
                  Start Coding <ArrowRight size={17} className="xd-arrow" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer page="about" />
    </div>
  );
}
