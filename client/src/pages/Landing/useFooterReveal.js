import { useEffect } from 'react';
const REDUCED = '(prefers-reduced-motion: reduce)';

// Tuning knobs
const VMAX = 2.2;        // px per ms (~2200px/s) counts as "full power"
const ATTACK = 0.45;     // rise speed per 16.7ms frame
const RELEASE = 0.09;    // fall speed after scrolling stops (the fade-out)
const RELEASE_UP = 0.35; // fall speed when scrolling up
const LAG = 0.2;         // band two trails band one
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const frameK = (k, dt) => 1 - Math.pow(1 - k, dt / 16.67);

export default function useFooterReveal(pageRef) {
  useEffect(() => {
    const page = pageRef.current;
    const footer = page?.querySelector('.landing-footer');
    const sheet = page?.querySelector('.landing-stack__sheet');
    const bandOne = page?.querySelector('.landing-stack__band--one');
    const bandTwo = page?.querySelector('.landing-stack__band--two');
    const nav = page?.querySelector('.landing-nav');
    if (!page || !footer || !sheet) return undefined;

    const reduced = window.matchMedia(REDUCED).matches;
    let under = false, frame = 0, raf = 0;
    let lastY = window.scrollY, lastT = performance.now();
    let p1 = 0, p2 = 0;

    const checkFit = () => {
      page.classList.toggle('is-footer-static', footer.offsetHeight > window.innerHeight + 1);
    };
    const ro = new ResizeObserver(checkFit);
    ro.observe(footer);
    window.addEventListener('resize', checkFit);
    checkFit();

    const writeBands = () => {
      if (!bandOne || !bandTwo) return;
      bandOne.style.setProperty('--band-p', p1.toFixed(3));
      bandTwo.style.setProperty('--band-p', (p1 + p2).toFixed(3));
    };

    // Power loop: runs only while scrolling or while the bands are still fading out.
    const tick = (now) => {
      const dt = Math.min(64, Math.max(1, now - lastT));
      lastT = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      const target = Math.pow(clamp01(dy / dt / VMAX), 0.7); // up or idle gives 0
      const k = target > p1 ? ATTACK : dy < 0 ? RELEASE_UP : RELEASE;
      p1 += (target - p1) * frameK(k, dt);
      p2 += (p1 - p2) * frameK(LAG, dt);
      if (p1 < 0.002) p1 = 0;
      if (p2 < 0.002) p2 = 0;
      writeBands();

      raf = p1 > 0 || p2 > 0 || dy !== 0 ? requestAnimationFrame(tick) : 0;
    };

    const update = () => {
      frame = 0;
      const navH = nav?.getBoundingClientRect().height ?? 0;
      const nextUnder = sheet.getBoundingClientRect().bottom < navH;
      if (nextUnder !== under) {
        under = nextUnder;
        page.classList.toggle('is-footer-under-nav', under);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      if (!reduced && !raf) {
        lastT = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkFit);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (raf) cancelAnimationFrame(raf);
      bandOne?.style.removeProperty('--band-p');
      bandTwo?.style.removeProperty('--band-p');
      page.classList.remove('is-footer-under-nav', 'is-footer-static');
    };
  }, [pageRef]);
}
