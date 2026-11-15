import type { CSSProperties } from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { CodeWorkspaceIllustration } from './CodeWorkspaceIllustration';
import { EDITOR_HREF } from './launch';

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export function HeroSection() {
  return (
    <section id="xd-top" className="xd-hero">
      <div className="xd-hero-grid" aria-hidden="true" />
      <div className="xd-glow a" aria-hidden="true" />
      <div className="xd-glow b" aria-hidden="true" />
      <div className="xd-glow c" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:pb-24 lg:pt-20">
        <div>
          <div className="xd-fade-up" style={delay(0)}>
            <span className="xd-badge"><i><Sparkles size={12} /></i> Free · No sign-up · Runs in your browser</span>
          </div>

          <h1 className="xd-h1 xd-fade-up" style={delay(90)}>
            <span>Build.</span>
            <span className="xd-gradient-text">Experiment.</span>
            <span>Create.</span>
          </h1>

          <p className="xd-lead xd-fade-up max-w-[34rem]" style={delay(190)}>
            Your ideas deserve a better workspace. Write code, experiment with new concepts and build websites in a powerful online coding studio.
          </p>

          <div className="xd-fade-up mt-8 flex flex-wrap items-center gap-3" style={delay(290)}>
            <a href={EDITOR_HREF} className="xd-btn xd-btn-primary">
              Start Coding Free <ArrowRight size={17} className="xd-arrow" />
            </a>
            <a href={EDITOR_HREF} className="xd-btn">
              <Play size={15} /> Explore Playground
            </a>
          </div>
        </div>

        <div className="xd-fade-up" style={delay(240)}>
          <CodeWorkspaceIllustration />
        </div>
      </div>
    </section>
  );
}
