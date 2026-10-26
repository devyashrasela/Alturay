import { useRef } from 'react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingHero from '../../components/landing/LandingHero';
import useHeroScrollSequence from './useHeroScrollSequence';
import './landing.css';

export default function LandingPage() {
  const sequenceRef = useRef(null);
  const stageRef = useRef(null);
  const motionEnabled = useHeroScrollSequence({ sequenceRef, stageRef });

  return (
    <div className={`landing-page${motionEnabled ? ' landing-page--motion' : ''}`}>
      <div className="landing-nav-dock">
        <LandingNavbar />
      </div>

      <main className="landing-page__content">
        <div className="landing-hero-sequence" ref={sequenceRef}>
          <div className="landing-hero-stage" ref={stageRef}>
            <LandingHero />
          </div>
        </div>

        {/* Page-background run-out. A future section can replace this spacer
            without changing the pinned timeline. */}
        <div className="landing-hero-release" aria-hidden="true" />
      </main>
    </div>
  );
}
