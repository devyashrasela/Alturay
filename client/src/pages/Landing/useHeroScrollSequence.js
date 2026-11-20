import { useEffect, useState } from 'react';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const clamp = (min, max, value) => Math.min(max, Math.max(min, value));

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

// The desktop logo grows an extra 16% on top of the artwork's cover zoom.
const DESKTOP_LOGO_EXTRA_GROWTH = 0.16;

// On the laptop the artwork's cover crop is negligible, so the floating cards
// stay framed while the panel expands. A phone covers by scaling a short strip
// almost 3.5x, which would throw the cards outside the viewport. Phones instead
// ease each card to a desktop-like framed position and let it grow by only the
// laptop's modest amount (the panel zoom is cancelled locally).
const CARD_FINAL_GROWTH = 1.07;
// Framed target positions, as fractions of the phone viewport, mirroring the
// laptop composition: products and invoice in the top corners, access card at
// the bottom centre.
const CARD_TARGETS = {
  products: { left: 0.04, top: 0.11 },
  invoice: { right: 0.04, top: 0.125 },
  access: { bottom: 0.05 },
};

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

// Mirrors the desktop cover calculation from the stylesheet using only the
// viewport. Phones need a much larger artwork zoom to cover the sticky stage,
// so this gives the logo and rings the growth they would have on the desktop
// composition at the same viewport size.
function getDesktopArtGrowth() {
  if (typeof window === 'undefined') return 0;
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);
  const gutter = clamp(20, 60, vw * 0.042);
  const artWidth = Math.max(1, Math.min(vw - gutter * 2, 1360));
  const baseStackHeight = clamp(450, 590, vw * 0.43);
  const stackHeight = Math.max(baseStackHeight, artWidth * (vh / vw));
  const coverScale = Math.max(vw / artWidth, vh / stackHeight) * 1.055;
  return Math.max(0, coverScale - 1);
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
 * Phones write the artwork transform, the copy fade, a counter-scale for the
 * logo/rings, and framed card positions directly. That keeps the nested details
 * growing at the desktop rate without restyling the whole hero through CSS
 * variables.
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
    const copy = stage.querySelector('.landing-hero__copy');
    const logo = stage.querySelector('.landing-hero__logo');
    const orbits = stage.querySelectorAll('.landing-hero__orbit');
    const layers = stage.querySelectorAll('.landing-hero__back, .landing-hero__panel');
    const cards = stage.querySelectorAll('.landing-hero__ui');
    const nav = document.querySelector('.landing-nav');
    const page = stage.closest('.landing-page');
    if (!art) return undefined;

    const readNumber = (element, property, fallback = 0) => {
      const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
      return Number.isFinite(value) ? value : fallback;
    };

    // The compact stylesheet sets the resting values; cache them once so the
    // scroll frames can apply the desktop proportions without reading styles.
    const layerSpecs = Array.from(layers, (element) => ({
      element,
      rotate: readNumber(element, '--layer-rotate'),
      radius: readNumber(element, '--layer-radius', 22),
    }));
    const cardSpecs = Array.from(cards, (element) => {
      const modifier = ['products', 'invoice', 'access']
        .find((name) => element.classList.contains(`landing-hero__ui--${name}`));
      const target = CARD_TARGETS[modifier] || CARD_TARGETS.products;

      return {
        element,
        rotate: readNumber(element, '--ui-rotate'),
        target,
        // Filled during measurement; the resting centre comes from layout and
        // the framed centre is derived from the viewport.
        restX: 0,
        restY: 0,
        finalX: 0,
        finalY: 0,
      };
    });

    let scrollFrame = 0;
    let measureFrame = 0;
    let disposed = false;
    let geometry = null;
    let navIsOverArt = null;
    let copyIsHidden = null;
    let lastProgress = '';
    let lastExpand = '';
    let lastCopy = '';

    const measureGeometry = () => {
      // Temporarily remove the animated transforms (and the panel's own
      // decorative rotation) so the resting layout can be measured. Scroll
      // frames then rebuild the phone choreography from these cached values.
      const previousArtTransform = art.style.transform;
      const previousTargetTransform = coverTarget.style.transform;
      const previousCardTransforms = cardSpecs.map(({ element }) => element.style.transform);
      art.style.transform = 'none';
      coverTarget.style.transform = 'none';
      cardSpecs.forEach(({ element }) => {
        element.style.transform = '';
      });

      const stageRect = stage.getBoundingClientRect();
      const targetRect = coverTarget.getBoundingClientRect();
      const artRect = art.getBoundingClientRect();
      const navHeight = nav?.getBoundingClientRect().height ?? 0;
      const stageLeft = stageRect.left;
      const stageTop = stageRect.top;
      const artCenterX = artRect.left - stageLeft + artRect.width / 2;
      const artCenterY = artRect.top - stageTop + artRect.height / 2;

      cardSpecs.forEach((spec) => {
        const rect = spec.element.getBoundingClientRect();
        const width = spec.element.offsetWidth || rect.width;
        const height = spec.element.offsetHeight || rect.height;
        const finalWidth = width * CARD_FINAL_GROWTH;
        const finalHeight = height * CARD_FINAL_GROWTH;
        const { target } = spec;

        spec.restX = rect.left - stageLeft + rect.width / 2;
        spec.restY = rect.top - stageTop + rect.height / 2;
        spec.finalY = target.bottom !== undefined
          ? stageRect.height * (1 - target.bottom) - finalHeight / 2
          : stageRect.height * target.top + finalHeight / 2;
        if (target.left !== undefined) {
          spec.finalX = stageRect.width * target.left + finalWidth / 2;
        } else if (target.right !== undefined) {
          spec.finalX = stageRect.width * (1 - target.right) - finalWidth / 2;
        } else {
          spec.finalX = stageRect.width / 2;
        }
      });

      art.style.transform = previousArtTransform;
      coverTarget.style.transform = previousTargetTransform;
      cardSpecs.forEach(({ element }, index) => {
        element.style.transform = previousCardTransforms[index];
      });

      const artWidth = targetRect.width || 1;
      const artHeight = targetRect.height || 1;
      const coverScale = Math.max(
        stageRect.width / artWidth,
        stageRect.height / artHeight,
      );
      const finalScale = coverScale * 1.055;
      const artTop = targetRect.top - stageTop;
      const panelCenterY = artTop + artHeight / 2;
      const finalShiftY = stageRect.height / 2 - panelCenterY;
      const scrollLength = Math.max(1, sequence.offsetHeight - stageRect.height);

      geometry = {
        artHeight,
        artTop,
        artCenterY: panelCenterY,
        // The transform is applied to the art wrapper, so the floating details
        // are mapped with the wrapper's own centre rather than the panel's.
        artMapCenterX: artCenterX,
        artMapCenterY: artCenterY,
        finalScale,
        finalShiftY,
        navHeight,
        scrollLength,
        desktopArtGrowth: compact ? getDesktopArtGrowth() : 0,
        // Cached once so phone scroll frames never read layout.
        sequenceTop: sequence.getBoundingClientRect().top + window.scrollY,
      };

      // A resize changes the cover scale and framed card targets, so force the
      // next progress frame to rewrite every animated property.
      lastProgress = '';
      lastExpand = '';
      lastCopy = '';

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
      const artScale = 1 + (geometry.finalScale - 1) * expand;

      if (compact) {
        // The phone keeps the desktop fade curve but writes it straight to the
        // copy element instead of restyling the whole hero through a variable.
        const copyKey = copyProgress.toFixed(4);
        if (copyKey !== lastCopy) {
          copy.style.opacity = (1 - copyProgress).toFixed(4);
          copy.style.transform = `translate3d(0, ${(-38 * copyProgress).toFixed(2)}px, 0)`;
          lastCopy = copyKey;
        }

        // The cover zoom is much larger on a short phone strip, so counter-scale
        // the logo and rings to keep the same on-screen growth as desktop. The
        // colour layers follow the desktop tilt/radius choreography, and the
        // cards ease to framed laptop positions so the cover crop cannot throw
        // them off-screen.
        if (expandKey !== lastExpand) {
          const shiftY = (geometry.finalShiftY * expand).toFixed(2);
          const desktopArtScale = 1 + geometry.desktopArtGrowth * expand;
          const logoScale =
            (desktopArtScale * (1 + DESKTOP_LOGO_EXTRA_GROWTH * expand) / artScale).toFixed(5);
          const orbitScale = (desktopArtScale / artScale).toFixed(5);

          art.style.transform = `translate3d(0, ${shiftY}px, 0) scale(${artScale.toFixed(5)})`;
          if (logo) logo.style.transform = `translate(-50%, -50%) scale(${logoScale})`;
          orbits.forEach((orbit) => {
            orbit.style.transform = `translate(-50%, -50%) scale(${orbitScale})`;
          });

          layerSpecs.forEach(({ element, rotate, radius }) => {
            element.style.transform =
              `rotate(${(rotate * (1 - expand * 0.7)).toFixed(3)}deg)`;
            element.style.borderRadius =
              `${(radius * (1 - expand * 0.72)).toFixed(2)}px`;
          });

          cardSpecs.forEach(({
            element, rotate, restX, restY, finalX, finalY,
          }) => {
            // Where the card would be if it simply rode the panel's zoom.
            const currentX =
              geometry.artMapCenterX + (restX - geometry.artMapCenterX) * artScale;
            const currentY =
              geometry.artMapCenterY
              + (restY - geometry.artMapCenterY) * artScale
              + geometry.finalShiftY * expand;
            // Where it should be on screen: the resting spot eased towards the
            // framed laptop position, so it stays in view for the whole zoom.
            const targetX = restX + (finalX - restX) * expand;
            const targetY = restY + (finalY - restY) * expand;
            // Cancel most of the panel zoom locally so the card grows at the
            // laptop's rate while sitting at the eased screen position.
            const cardScale = (1 + (CARD_FINAL_GROWTH - 1) * expand) / artScale;

            element.style.transform =
              `translate3d(${((targetX - currentX) / artScale).toFixed(2)}px, ${((targetY - currentY) / artScale).toFixed(2)}px, 0) `
              + `rotate(${(rotate * (1 - expand * 0.55)).toFixed(3)}deg) scale(${cardScale.toFixed(5)})`;
          });

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
      const currentScale = artScale;
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
      if (compact) {
        art.style.removeProperty('transform');
        copy.style.opacity = '';
        copy.style.transform = '';
        logo?.style.removeProperty('transform');
        orbits.forEach((orbit) => orbit.style.removeProperty('transform'));
        layerSpecs.forEach(({ element }) => {
          element.style.removeProperty('transform');
          element.style.removeProperty('border-radius');
        });
        cardSpecs.forEach(({ element }) => element.style.removeProperty('transform'));
      }
      stage.style.removeProperty('--hero-progress');
      stage.style.removeProperty('--hero-expand');
      stage.style.removeProperty('--hero-copy');
      stage.style.removeProperty('--hero-scale');
      stage.style.removeProperty('--hero-shift-y');
    };
  }, [motionEnabled, compact, sequenceRef, stageRef]);

  return motionEnabled;
}
