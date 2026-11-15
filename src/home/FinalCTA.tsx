import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { EDITOR_HREF } from './launch';

export function FinalCTA() {
  return (
    <section className="xd-section !pt-0">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <div className="xd-cta">
            <h2 className="xd-h2 mx-auto max-w-2xl">Your next project <span className="xd-gradient-text">starts here.</span></h2>
            <p className="xd-lead mx-auto max-w-xl">Open your workspace and turn your ideas into something real.</p>
            <a href={EDITOR_HREF} className="xd-btn xd-btn-primary mt-8">
              Open XDevCodeStudio <ArrowRight size={17} className="xd-arrow" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
