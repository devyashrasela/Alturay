import { useEffect } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * useFooterScrollTransition
 *
 * Coordinates the scroll-linked reveal of the landing footer:
 * 1. The colored transition strips (blue, yellow) and black footer sheet enter
 *    with document flow in stacked unison with constant vertical offsets.
 * 2. The footer content inside the black sheet is pinned relative to the viewport
 *    while the black sheet rises upward from below, revealing the content from the
 *    bottom (giant ALTURAY wordmark, copyright, subject chips) to the top
 *    (display heading, collaborate link, newsletter).
 * 3. Once the black sheet fills the viewport (rect.top <= 0), the content settles
 *    seamlessly into its natural document flow position.
 * 4. Fully reversible when scrolling upward.
 * 5. Respects prefers-reduced-motion (no transforms applied).
 * 6. Zero React re-renders on scroll: throttled via requestAnimationFrame and
 *    direct transform styling.
 */
export default function useFooterScrollTransition({ sheetRef, innerRef }) {
  useEffect(() => {
    const sheet = sheetRef?.current;
    const inner = innerRef?.current;
    if (!sheet || !inner) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (prefersReducedMotion) {
      inner.style.transform = '';
      return undefined;
    }

    let rafId = null;

    const update = () => {
      rafId = null;
      const rect = sheet.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const innerHeight = inner.offsetHeight;

      // On desktop, innerHeight <= windowHeight (inner has min-height: 100vh),
      // so targetInnerTop = 0 (pinned to top of viewport when revealed).
      // On small screens/mobile where innerHeight > windowHeight,
      // targetInnerTop = windowHeight - innerHeight so the bottom of the content
      // (wordmark/legal) is pinned to the viewport bottom during the entrance.
      const targetInnerTop = Math.min(0, windowHeight - innerHeight);

      let shift = 0;
      if (rect.top > targetInnerTop && rect.top < windowHeight) {
        shift = targetInnerTop - rect.top;
      } else if (rect.top >= windowHeight) {
        shift = targetInnerTop - windowHeight;
      } else {
        shift = 0;
      }

      // Calculate progress 0..1 for custom property consumers
      const totalDistance = windowHeight - targetInnerTop;
      const progress =
        totalDistance > 0
          ? Math.max(0, Math.min(1, (windowHeight - rect.top) / totalDistance))
          : 1;

      sheet.style.setProperty('--footer-reveal-progress', progress.toFixed(3));
      inner.style.transform = shift === 0 ? '' : `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    };

    const onScrollOrResize = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    // Initial positioning
    update();

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (inner) {
        inner.style.transform = '';
      }
      if (sheet) {
        sheet.style.removeProperty('--footer-reveal-progress');
      }
    };
  }, [sheetRef, innerRef]);
}

