import { useEffect, useRef, useState } from 'react';
import './home.css';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { QuickStartSection } from './QuickStartSection';
import { TemplateGallery } from './TemplateGallery';
import { FeatureSection } from './FeatureSection';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';
import { SCROLLER_ID, scrollToId, takePendingScroll } from './scroll';
import { useTheme } from './theme';

type Active = 'xd-top' | 'templates' | 'features';

export default function HomePage() {
  const { theme, toggle } = useTheme();
  const scroller = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<Active>('xd-top');

  useEffect(() => {
    const prev = document.title;
    document.title = 'XDevCodeStudio — Build. Experiment. Create.';
    return () => {
      document.title = prev;
    };
  }, []);

  // arriving from the About page via "Templates" / "Explore"
  useEffect(() => {
    const id = takePendingScroll();
    if (!id) return;
    const t = setTimeout(() => scrollToId(id), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(el.scrollTop > 8);
      const base = el.getBoundingClientRect().top;
      const topOf = (id: string) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) - base;
      setActive(topOf('features') <= 140 ? 'features' : topOf('templates') <= 140 ? 'templates' : 'xd-top');
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div id={SCROLLER_ID} ref={scroller} className="xd-home" data-theme={theme}>
      <Navbar theme={theme} onToggleTheme={toggle} scrolled={scrolled} active={active} />
      <main>
        <HeroSection />
        <QuickStartSection />
        <TemplateGallery />
        <FeatureSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
