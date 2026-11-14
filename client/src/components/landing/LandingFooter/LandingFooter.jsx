import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/*
 * "Footer" landing section.
 *
 * The footer is a stationary sticky layer (position: sticky; bottom: 0)
 * revealed by the page stack lifting off it as the user scrolls. Two
 * colored bands between the stack's bottom edge and the footer create a
 * brief curtain-reveal transition controlled entirely by CSS classes
 * toggled in useFooterReveal.
 *
 * Content mapping to Alturay (tracking the reference structure):
 * - top-left: two-line display heading + a pill action that routes to
 *   /register (the reference's collaborate pill).
 * - top-right: an Explore list of real in-page anchors and the login route (no newsletter: there is no delivery backend).
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

const FOOTER_LINKS = [
  { label: 'Features', href: '#everything-in-one-place' },
  { label: 'Businesses', href: '#multi-business' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Log in', to: '/login' },
];

export default function LandingFooter() {
  const wordRef = useRef(null);

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
      <div className="landing-footer__sheet">
        <div className="landing-footer__inner">
          <div className="landing-footer__top">
            <div className="landing-footer__pitch">
              <h2 className="landing-footer__title">
                <span className="landing-footer__title-line">Let's explore</span>
                <span className="landing-footer__title-line">what's next</span>
              </h2>
              <Link className="landing-footer__collab" to="/register">
                Get started
              </Link>
            </div>

            <nav className="landing-footer__news" aria-labelledby="landing-footer-explore">
              <span className="landing-footer__news-label" id="landing-footer-explore">Explore</span>
              <ul className="landing-footer__links">
                {FOOTER_LINKS.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link className="landing-footer__link" to={item.to}>
                        <span>{item.label}</span>
                        <ArrowRight className="landing-footer__link-arrow" size={15} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    ) : (
                      <a className="landing-footer__link" href={item.href}>
                        <span>{item.label}</span>
                        <ArrowRight className="landing-footer__link-arrow" size={15} strokeWidth={2.2} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
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
