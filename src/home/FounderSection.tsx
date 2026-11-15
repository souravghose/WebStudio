import { useState } from 'react';
import { Reveal } from './Reveal';

// The photograph is used exactly as supplied (GitHub avatar URL).
const PHOTO_URL = 'https://avatars.githubusercontent.com/u/66877167?s=400&u=f1fb0371c2dac6849484724bcc186fdba85a7623&v=4';

export function FounderSection() {
  const [failed, setFailed] = useState(false);

  return (
    <section id="founder" className="xd-section">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <span className="xd-eyebrow">Founder</span>
          <h2 className="xd-h2">Meet the <span className="xd-gradient-text">Founder</span></h2>
        </Reveal>

        <Reveal>
          <article className="xa-founder" aria-label="Sourav Ghose, Founder and CEO of XDevCodeStudio">
            <div className="xa-photo-col">
              <div className="xa-photo-ring">
                {failed ? (
                  <div className="xa-photo-fallback" role="img" aria-label="Initials of Sourav Ghose">SG</div>
                ) : (
                  <img
                    className="xa-photo"
                    src={PHOTO_URL}
                    alt="Portrait of Sourav Ghose, founder and CEO of XDevCodeStudio"
                    width={400}
                    height={400}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onError={() => setFailed(true)}
                  />
                )}
              </div>
              <h3 className="xa-name">Sourav Ghose</h3>
              <span className="xa-role">Founder &amp; CEO</span>
              <p className="xa-company">XDevCodeStudio</p>
            </div>

            <div className="xa-bio">
              <div className="xa-quote-mark" aria-hidden="true">“</div>
              <p>Hi, I’m Sourav Ghose, the founder and CEO of XDevCodeStudio.</p>
              <p>I’m passionate about technology, digital products and creating useful tools that make everyday work easier.</p>
              <p>I started XDevCodeStudio with a vision to build a simple yet powerful online coding environment where people can experiment, learn and create without unnecessary barriers.</p>
              <p>My goal is to continuously improve the platform, explore new possibilities and create something genuinely useful for the developer community.</p>
              <p>XDevCodeStudio represents my commitment to turning an idea into a practical product and making coding a more accessible experience.</p>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
