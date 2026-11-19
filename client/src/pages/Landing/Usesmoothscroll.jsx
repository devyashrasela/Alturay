import { useEffect, useState } from 'react';
import Lenis from 'lenis';

const MOBILE_QUERY = '(max-width: 760px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getMobilePreference() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMotionAllowed() {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/*
 * Inertia ("lerp") smooth scrolling for the landing page only. Desktop keeps
 * its wheel-only tuning unchanged. Phones use Lenis's touch sync with the same
 * 0.085 lerp so the pinned hero glides like the computer display instead of
 * stepping with the raw touch stream. Destroyed on unmount, so app routes keep
 * native scrolling.
 *
 * Tuning: lower lerp = floatier/longer glide, higher = snappier.
 */
export default function useSmoothScroll() {
  const [mobile, setMobile] = useState(getMobilePreference);
  const [motionAllowed, setMotionAllowed] = useState(getMotionAllowed);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reducedQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => {
      setMobile(mobileQuery.matches);
      setMotionAllowed(!reducedQuery.matches);
    };

    handleChange();
    mobileQuery.addEventListener('change', handleChange);
    reducedQuery.addEventListener('change', handleChange);
    return () => {
      mobileQuery.removeEventListener('change', handleChange);
      reducedQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!motionAllowed) return undefined;

    const options = mobile
      ? {
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.085,
        touchInertiaExponent: 1.7,
      }
      : { lerp: 0.085, smoothWheel: true };

    const lenis = new Lenis(options);

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
  }, [mobile, motionAllowed]);
}
