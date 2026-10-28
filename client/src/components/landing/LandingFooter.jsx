import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useFooterScrollTransition from '../../pages/Landing/useFooterScrollTransition';

/*
 * "Footer" landing section.
 *
 * Reference composition (footer-reference.png): a solid black sheet with
 * rounded top corners arriving as the page's final normal-flow block (the
 * entrance film shows a plain flow scroll — no pin, no overlay reveal, so
 * nothing animates independently here). A white notch (the page above it,
 * ended just before the sheet) peeks above the rounded corners.
 *
 * Content mapping to Alturay (tracking the reference structure):
 * - top-left: two-line display heading + a pill action that routes to
 *   /register (the reference's collaborate pill).
 * - top-right: the reference's newsletter block, kept as a disabled,
 *   honestly-labelled control (no fabricated delivery behavior / backend).
 * - bottom: the giant wordmark (ALTURAY). The hover film shows letters
 *   deforming in a small radius around the pointer (stair-step/liquid melt)
 *   and resetting cleanly when the pointer leaves — reproduced with a
 *   transform-only per-letter wobble (cursor changes to pointer as well).
 * - bottom-left: copyright line only. The reference's policy/social links
 *   are intentionally not reproduced: no such destinations exist.
 * - bottom-right (under the wordmark): static decorative subject chips
 *   without anchor semantics (no invented profiles).
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

const WORDMARK = 'ALTURAY'.split('');

export default function LandingFooter() {
  const wordRef = useRef(null);
  const sheetRef = useRef(null);
  const innerRef = useRef(null);

  useFooterScrollTransition({ sheetRef, innerRef });

  /*
   * Wordmark hover (per the hover film): letters near the pointer deform
   * (a stair-step / liquid melt around the cursor) and everything resets
   * cleanly to the resting wordmark when the pointer leaves. Reproduced
   * with transform-only per-letter wobble (no layout shift, no width
   * changes, no overflow) that never leaves residue behind. Listeners live
   * only on fine-pointer, non-reduced-motion environments, and cleanup
   * clears every listener, class, and inline transform (StrictMode-safe).
   */
  useEffect(() => {
    const word = wordRef.current;
    if (!word) return undefined;
    if (REDUCED_MOTION) return undefined;

    const glyphs = Array.from(word.querySelectorAll('.landing-footer__glyph'));
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let cached = null; // glyph centers relative to the word's left edge

    const clear = () => {
      glyphs.forEach((glyph) => {
        if (glyph.style.transform) glyph.style.transform = '';
      });
    };

    const onEnter = () => {
      cached = null; // re-measure on each visit
    };

    const onMove = (event) => {
      const wordBox = word.getBoundingClientRect();
      if (!cached) {
        const base = wordBox.left;
        cached = glyphs.map((glyph) => {
          const box = glyph.getBoundingClientRect();
          return box.left + box.width / 2 - base;
        });
      }
      const radius = Math.max(80, wordBox.height * 1.05);
      glyphs.forEach((glyph, index) => {
        const d = Math.abs(event.clientX - (wordBox.left + cached[index]));
        let t = 1 - d / radius;
        if (t <= 0) {
          if (glyph.style.transform) glyph.style.transform = '';
          return;
        }
        t *= t; // strongest right under the cursor
        const dir = index % 2 === 0 ? 1 : -1;
        glyph.style.transform =
          `translateY(${(-t * 5.5).toFixed(2)}px) ` +
          `scaleY(${(1 + t * 0.5).toFixed(3)}) ` +
          `skewX(${(dir * t * 13).toFixed(2)}deg)`;
      });
    };

    const onLeave = () => clear();

    const apply = (enabled) => {
      if (!enabled) {
        word.classList.remove('landing-footer__word--hoverable');
        word.removeEventListener('pointerenter', onEnter);
        word.removeEventListener('pointermove', onMove);
        word.removeEventListener('pointerleave', onLeave);
        clear();
        return;
      }
      word.classList.add('landing-footer__word--hoverable');
      word.addEventListener('pointerenter', onEnter);
      word.addEventListener('pointermove', onMove);
      word.addEventListener('pointerleave', onLeave);
    };

    const onChange = () => apply(fine.matches);
    apply(fine.matches);
    fine.addEventListener?.('change', onChange);

    return () => {
      fine.removeEventListener?.('change', onChange);
      word.removeEventListener('pointerenter', onEnter);
      word.removeEventListener('pointermove', onMove);
      word.removeEventListener('pointerleave', onLeave);
      word.classList.remove('landing-footer__word--hoverable');
      clear();
    };
  }, []);

  return (
    <footer className="landing-footer" id="footer">
      <div className="landing-footer__transition" aria-hidden="true">
        <span className="landing-footer__transition-blue" />
        <span className="landing-footer__transition-yellow" />
      </div>
      <div className="landing-footer__sheet" ref={sheetRef}>
        <div className="landing-footer__inner" ref={innerRef}>
          <div className="landing-footer__top">
            <div className="landing-footer__pitch">
              <h2 className="landing-footer__title">
                <span className="landing-footer__title-line">Let’s explore</span>
                <span className="landing-footer__title-line">what’s next</span>
              </h2>
              <Link className="landing-footer__collab" to="/register">
                Get started
              </Link>
            </div>

            <div className="landing-footer__news">
              <span className="landing-footer__news-label">Join our newsletter</span>
              <div className="landing-footer__news-row">
                <input
                  className="landing-footer__input"
                  type="email"
                  name="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  autoComplete="off"
                  disabled
                />
                <button type="button" className="landing-footer__subscribe" disabled tabIndex={-1}>
                  Subscribe
                </button>
              </div>
              <p className="landing-footer__news-note">
                Subscriptions aren’t wired up in this preview build yet.
              </p>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <div>
              <p className="landing-footer__legal">© Alturay 2026. All rights reserved.</p>
            </div>
            <div className="landing-footer__brand">
              <span className="landing-footer__word" id="landing-footer-word" ref={wordRef}>
                <span className="sr-only">ALTURAY</span>
                <span className="landing-footer__glyphs" aria-hidden="true">
                  {WORDMARK.map((letter, index) => (
                    <span className="landing-footer__glyph" key={`${letter}-${index}`}>
                      {letter}
                    </span>
                  ))}
                </span>
              </span>
              <div className="landing-footer__chips">
                <span className="landing-footer__chip">Alturay Studio</span>
                <span className="landing-footer__chip">Multi-Business</span>
                <span className="landing-footer__chip">Billing</span>
                <span className="landing-footer__chip">Team access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
