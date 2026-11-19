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
const COMPACT_QUERY = '(max-width: 760px)';

function getMotionPreference() {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getCompactPreference() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(COMPACT_QUERY).matches;
}

// While the stage is sticky its viewport top is clamped to zero; before and
// after the pin it follows the sequence edges. Phones use this cached result
// instead of reading layout from the DOM on every scroll frame.
function getStageTop(geometry, scrollY) {
  const pinStart = geometry.sequenceTop;
  const pinEnd = geometry.sequenceTop + geometry.scrollLength;
  if (scrollY < pinStart) return pinStart - scrollY;
  if (scrollY > pinEnd) return pinEnd - scrollY;
  return 0;
}

/**
 * Drives the hero's scroll choreography with a single rAF-throttled scroll
 * listener. Desktop exposes CSS custom properties for the whole composition.
 * Phones write only the artwork's transform directly: the compact layout keeps
 * its nested layers static, so there is no subtree style recalculation on
 * scroll and the transform stays on the compositor.
 */
export default function useHeroScrollSequence({ sequenceRef, stageRef }) {
  const [motionEnabled, setMotionEnabled] = useState(getMotionPreference);
  const [compact, setCompact] = useState(getCompactPreference);

  useEffect(() => {
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const compactQuery = window.matchMedia(COMPACT_QUERY);
    const handleChange = () => {
      setMotionEnabled(!motionQuery.matches);
      setCompact(compactQuery.matches);
    };

    handleChange();
    motionQuery.addEventListener('change', handleChange);
    compactQuery.addEventListener('change', handleChange);
    return () => {
      motionQuery.removeEventListener('change', handleChange);
      compactQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!motionEnabled) return undefined;

    const sequence = sequenceRef.current;
    const stage = stageRef.current;
    if (!sequence || !stage) return undefined;

    const art = stage.querySelector('.landing-hero__art');
    // The phone layout drops the violet panel below the colour layers so their
    // edges stay visible. Measure the panel itself: on desktop it shares the
    // art rect exactly, so this is a no-op there.
    const coverTarget = stage.querySelector('.landing-hero__panel') || art;
    const nav = document.querySelector('.landing-nav');
    const page = stage.closest('.landing-page');
    if (!art) return undefined;

    let scrollFrame = 0;
    let measureFrame = 0;
    let disposed = false;
    let geometry = null;
    let navIsOverArt = null;
    let copyIsHidden = null;
    let lastProgress = '';
    let lastExpand = '';

    const measureGeometry = () => {
      // Temporarily remove the animated transform (and the panel's own
      // decorative rotation) to measure the untransformed cover geometry.
      const previousArtTransform = art.style.transform;
      const previousTargetTransform = coverTarget.style.transform;
      art.style.transform = 'none';
      coverTarget.style.transform = 'none';

      const stageRect = stage.getBoundingClientRect();
      const targetRect = coverTarget.getBoundingClientRect();
      const navHeight = nav?.getBoundingClientRect().height ?? 0;

      art.style.transform = previousArtTransform;
      coverTarget.style.transform = previousTargetTransform;

      const artWidth = targetRect.width || 1;
      const artHeight = targetRect.height || 1;
      const coverScale = Math.max(
        stageRect.width / artWidth,
        stageRect.height / artHeight,
      );
      const finalScale = coverScale * 1.055;
      const artTop = targetRect.top - stageRect.top;
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
        // Cached once so phone scroll frames never read layout.
        sequenceTop: sequence.getBoundingClientRect().top + window.scrollY,
      };

      if (!compact) {
        stage.style.setProperty('--hero-scale', finalScale.toFixed(4));
        stage.style.setProperty('--hero-shift-y', `${finalShiftY.toFixed(2)}px`);
      }
    };

    const setNavState = (next) => {
      if (next === navIsOverArt) return;
      navIsOverArt = next;
      page?.classList.toggle('is-hero-art-under-nav', next);
      stage.classList.toggle('is-art-under-nav', next);
    };

    const setCopyHidden = (next) => {
      if (next === copyIsHidden) return;
      copyIsHidden = next;
      stage.classList.toggle('is-copy-hidden', next);
    };

    const applyProgress = () => {
      scrollFrame = 0;
      if (!geometry) return;

      let stageTop;
      let progress;
      if (compact) {
        progress = clamp01((window.scrollY - geometry.sequenceTop) / geometry.scrollLength);
        stageTop = getStageTop(geometry, window.scrollY);
      } else {
        const sequenceTop = sequence.getBoundingClientRect().top;
        const stageRect = stage.getBoundingClientRect();
        stageTop = stageRect.top;
        progress = clamp01(-sequenceTop / geometry.scrollLength);
      }

      const expand = easeInOutCubic(progress / EXPAND_END);
      const copyProgress = smoothstep(progress / COPY_FADE_END);
      const progressKey = progress.toFixed(4);
      const expandKey = expand.toFixed(4);

      if (compact) {
        // One inline transform on the artwork itself. The compact CSS keeps the
        // cards, layers and logo static, so no descendants are restyled.
        if (expandKey !== lastExpand) {
          const scale = (1 + (geometry.finalScale - 1) * expand).toFixed(5);
          const shiftY = (geometry.finalShiftY * expand).toFixed(2);
          art.style.transform = `translate3d(0, ${shiftY}px, 0) scale(${scale})`;
          lastExpand = expandKey;
        }
      } else if (progressKey !== lastProgress) {
        stage.style.setProperty('--hero-progress', progressKey);
        stage.style.setProperty('--hero-expand', expandKey);
        stage.style.setProperty('--hero-copy', copyProgress.toFixed(4));
        lastProgress = progressKey;
      }

      // Keep the navbar legible once the artwork reaches it. This is derived
      // from the same cached geometry so it works at every responsive size
      // without a hard-coded breakpoint or per-frame layout reads on phones.
      const currentScale = 1 + (geometry.finalScale - 1) * expand;
      const artScreenTop =
        stageTop +
        geometry.artCenterY +
        (geometry.artTop - geometry.artCenterY) * currentScale +
        geometry.finalShiftY * expand;
      const artScreenBottom = artScreenTop + geometry.artHeight * currentScale;
      const isOverArt =
        artScreenTop - 28 * currentScale <= geometry.navHeight + 8 &&
        artScreenBottom > 0;

      setNavState(isOverArt);
      setCopyHidden(progress >= COPY_HIDE_AT);
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
      if (compact) art.style.removeProperty('transform');
      stage.style.removeProperty('--hero-progress');
      stage.style.removeProperty('--hero-expand');
      stage.style.removeProperty('--hero-copy');
      stage.style.removeProperty('--hero-scale');
      stage.style.removeProperty('--hero-shift-y');
    };
  }, [motionEnabled, compact, sequenceRef, stageRef]);

  return motionEnabled;
}
