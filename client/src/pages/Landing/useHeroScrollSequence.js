import { useEffect, useState } from 'react';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const easeInOutCubic = (value) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
};

// The artwork finishes expanding slightly before the pin ends, leaving a short
// hold at full viewport before the sequence releases into the page.
const EXPAND_END = 0.84;
const COPY_FADE_END = 0.3;
const COPY_HIDE_AT = 0.31;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getMotionPreference() {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Drives the hero's scroll choreography with a single rAF-throttled scroll
 * listener. All visual values are exposed as CSS custom properties on the
 * sticky stage so the browser can keep the animation on the compositor.
 */
export default function useHeroScrollSequence({ sequenceRef, stageRef }) {
  const [motionEnabled, setMotionEnabled] = useState(getMotionPreference);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => setMotionEnabled(!query.matches);

    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!motionEnabled) return undefined;

    const sequence = sequenceRef.current;
    const stage = stageRef.current;
    if (!sequence || !stage) return undefined;

    const art = stage.querySelector('.landing-hero__art');
    const nav = document.querySelector('.landing-nav');
    const page = stage.closest('.landing-page');
    if (!art) return undefined;

    let scrollFrame = 0;
    let measureFrame = 0;
    let disposed = false;
    let geometry = null;

    const measureGeometry = () => {
      // Temporarily remove the animated transform to measure the artwork's
      // untransformed position and size.
      const previousTransform = art.style.transform;
      art.style.transform = 'none';

      const stageRect = stage.getBoundingClientRect();
      const artRect = art.getBoundingClientRect();
      const artWidth = artRect.width || 1;
      const artHeight = artRect.height || 1;
      const navHeight = nav?.getBoundingClientRect().height ?? 0;

      art.style.transform = previousTransform;

      const coverScale = Math.max(
        stageRect.width / artWidth,
        stageRect.height / artHeight,
      );
      const finalScale = coverScale * 1.055;
      const artTop = artRect.top - stageRect.top;
      const artCenterY = artTop + artHeight / 2;
      const finalShiftY = stageRect.height / 2 - artCenterY;
      const scrollLength = Math.max(1, sequence.offsetHeight - stageRect.height);

      geometry = {
        artHeight,
        artTop,
        artCenterY,
        finalScale,
        finalShiftY,
        navHeight,
        scrollLength,
      };

      stage.style.setProperty('--hero-scale', finalScale.toFixed(4));
      stage.style.setProperty('--hero-shift-y', `${finalShiftY.toFixed(2)}px`);
    };

    const applyProgress = () => {
      scrollFrame = 0;
      if (!geometry) return;

      const sequenceTop = sequence.getBoundingClientRect().top;
      const stageRect = stage.getBoundingClientRect();
      const progress = clamp01(-sequenceTop / geometry.scrollLength);

      const expand = easeInOutCubic(progress / EXPAND_END);
      const copyProgress = smoothstep(progress / COPY_FADE_END);

      stage.style.setProperty('--hero-progress', progress.toFixed(4));
      stage.style.setProperty('--hero-expand', expand.toFixed(4));
      stage.style.setProperty('--hero-copy', copyProgress.toFixed(4));

      // Keep the navbar legible once the artwork reaches it. This is measured
      // from the actual transformed artwork geometry so it works at every
      // responsive size without a hard-coded breakpoint.
      const currentScale = 1 + (geometry.finalScale - 1) * expand;
      const artScreenTop =
        stageRect.top +
        geometry.artCenterY +
        (geometry.artTop - geometry.artCenterY) * currentScale +
        geometry.finalShiftY * expand;
      const artScreenBottom = artScreenTop + geometry.artHeight * currentScale;
      const navIsOverArt =
        artScreenTop - 28 * currentScale <= geometry.navHeight + 8 &&
        artScreenBottom > 0;

      page?.classList.toggle('is-hero-art-under-nav', navIsOverArt);
      stage.classList.toggle('is-art-under-nav', navIsOverArt);
      stage.classList.toggle('is-copy-hidden', progress >= COPY_HIDE_AT);
    };

    const requestProgress = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(applyProgress);
    };

    const requestMeasurement = () => {
      if (measureFrame) return;
      measureFrame = window.requestAnimationFrame(() => {
        measureFrame = 0;
        measureGeometry();
        applyProgress();
      });
    };

    measureGeometry();
    applyProgress();

    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestMeasurement);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(requestMeasurement);
      resizeObserver.observe(stage);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!disposed) requestMeasurement();
      });
    }

    return () => {
      disposed = true;
      window.removeEventListener('scroll', requestProgress);
      window.removeEventListener('resize', requestMeasurement);
      resizeObserver?.disconnect();

      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (measureFrame) window.cancelAnimationFrame(measureFrame);

      page?.classList.remove('is-hero-art-under-nav');
      stage.classList.remove('is-art-under-nav', 'is-copy-hidden');
      stage.style.removeProperty('--hero-progress');
      stage.style.removeProperty('--hero-expand');
      stage.style.removeProperty('--hero-copy');
      stage.style.removeProperty('--hero-scale');
      stage.style.removeProperty('--hero-shift-y');
    };
  }, [motionEnabled, sequenceRef, stageRef]);

  return motionEnabled;
}
