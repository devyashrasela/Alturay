import { useRef } from 'react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingHero from '../../components/landing/LandingHero';
import LandingEverything from '../../components/landing/LandingEverything';
import LandingMultiBusiness from '../../components/landing/LandingMultiBusiness';
import LandingFaq from '../../components/landing/LandingFaq';
import LandingFinalCta from '../../components/landing/LandingFinalCta';
import LandingFooter from '../../components/landing/LandingFooter';
import useHeroScrollSequence from './useHeroScrollSequence';
import useSmoothScroll from './Usesmoothscroll';
import useFooterReveal from './useFooterReveal';
import './landing.css';

export default function LandingPage() {
  useSmoothScroll();
  const sequenceRef = useRef(null);
  const stageRef = useRef(null);
  const pageRef = useRef(null);
  const motionEnabled = useHeroScrollSequence({ sequenceRef, stageRef });
  useFooterReveal(pageRef);

  return (
    <div ref={pageRef} className={`landing-page${motionEnabled ? ' landing-page--motion' : ''}`}>
      <div className="landing-nav-dock">
        <LandingNavbar />
      </div>

      <main className="landing-page__content">
        <div className="landing-stack">
          <div className="landing-stack__sheet">
            <div className="landing-hero-sequence" id="home" ref={sequenceRef}>
              <div className="landing-hero-stage" ref={stageRef}>
                <LandingHero />
              </div>
            </div>

            {/* Page-background run-out. The "Everything in One Place" section
                below replaces the old spacer content without changing the pinned
                timeline. */}
            <div className="landing-hero-release" aria-hidden="true" />

            <LandingEverything />

            <LandingMultiBusiness />

            {/* FAQ: next section in the same white field. Its own reveal runs as
                the section's heading resolves out of the fold, like the film. */}
            <LandingFaq />

            <LandingFinalCta />
          </div>
          <span className="landing-stack__band landing-stack__band--one" aria-hidden="true" />
          <span className="landing-stack__band landing-stack__band--two" aria-hidden="true" />
        </div>

        <LandingFooter />
      </main>
    </div>
  );
}
