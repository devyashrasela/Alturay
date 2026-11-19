import { useEffect, useState } from 'react';
import Lenis from 'lenis';

const MOBILE_QUERY = '(max-width: 760px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getEnabled() {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(MOBILE_QUERY).matches &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/*
 * Inertia ("lerp") smooth scrolling for the landing page only. Phones keep
 * native touch momentum scrolling: Lenis's wheel interpolation adds a constant
 * rAF loop without improving touch input, so it is disabled below 760px.
 * Lenis drives the real window scroll position on desktop, so position: sticky,
 * the hero scroll sequence, IntersectionObserver and scroll listeners keep
 * working. Destroyed on unmount, so app routes keep native scrolling.
 *
 * Tuning: lower lerp = floatier/longer glide, higher = snappier.
 */
export default function useSmoothScroll() {
  const [enabled, setEnabled] = useState(getEnabled);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reducedQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => setEnabled(getEnabled());

    handleChange();
    mobileQuery.addEventListener('change', handleChange);
    reducedQuery.addEventListener('change', handleChange);
    return () => {
      mobileQuery.removeEventListener('change', handleChange);
      reducedQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });

    let frame = 0;
    const raf = (time) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };
    frame = window.requestAnimationFrame(raf);

    // In-page anchors (#multi-business etc.) glide with the same inertia.
    const onClick = (event) => {
      const link = event.target.closest?.('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      const nav = document.querySelector('.landing-nav');
      lenis.scrollTo(target, { offset: -((nav?.offsetHeight ?? 0) + 16) });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      window.cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [enabled]);
}
