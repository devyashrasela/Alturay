import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/*
 * "Final CTA" landing section.
 *
 * Reference film grammar: the panel is a periwinkle rounded sheet set in the
 * same white field as the FAQ, entered as a plain document-flow block — no
 * pinning, no clipped-viewport trick. Its single non-flow accent (measured
 * from the film at ~1100-wide crop): a small rounded color swatch (violet
 * leaf with a yellow and a smaller rose child) that always pokes ABOVE the
 * panel's final top edge — even mid-scroll, morphing into the paper-plane
 * illustration's fold — so it rides inside the panel (overflow hidden) and
 * lands exactly as the panel's bottom settles. The right-bottom corner is
 * rounded visibly more than the others. A drop space follows the panel (the
 * footer-reveal slot, implemented with the footer).
 *
 * The illustration is a deliberately flat, brand-toned CSS mock of the
 * film's spiral-stationery 3D piece (cards + plane) — clearly illustrative,
 * not a screenshot. Everything decorative is aria-hidden; the CTA is a real
 * router link to /register.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

export default function LandingFinalCta() {
  const [reveal, setReveal] = useState('none'); // none | armed | revealed
  const sectionRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const node = sectionRef.current;
    if (!node) return undefined;

    // The film's panel lead-in: the swatch rides above the panel's top edge
    // while the panel rises from below the fold. The one-shot reveal starts
    // while the panel is still fully below the viewport bottom, like the film.
    let io;
    const arm = window.requestAnimationFrame(() => {
      setReveal('armed');
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setReveal('revealed');
            io.disconnect();
          }
        },
        { rootMargin: '0px 0px -6% 0px' },
      );
      io.observe(node);
    });

    return () => {
      window.cancelAnimationFrame(arm);
      io?.disconnect();
    };
  }, []);

  return (
    <section
      id="get-started"
      ref={sectionRef}
      className={
        `landing-cta` +
        `${reveal === 'armed' ? ' landing-cta--armed' : ''}` +
        `${reveal === 'revealed' ? ' landing-cta--revealed' : ''}`
      }
      aria-labelledby="landing-cta-title"
    >
      <div className="landing-cta__panel" ref={panelRef}>
        <div className="landing-cta__copy">
          <h2 className="landing-cta__title" id="landing-cta-title">
            <span className="landing-cta__title-line">Bring your business</span>
            <span className="landing-cta__title-line">together.</span>
          </h2>
          <p className="landing-cta__lede">
            Manage products, billing, and multiple businesses from one simple
            platform.
          </p>
          <Link className="landing-cta__button" to="/register">
            Get Started
          </Link>
        </div>

        {/* Illustrative stationery composition — flat brand-toned mock of the
            reference's spiral piece. Not a screenshot; aria-hidden. */}
        <div className="landing-cta__art" aria-hidden="true">
          <span className="landing-cta__art-dot" />
          <span className="landing-cta__art-card" />
          <span className="landing-cta__art-spiral" />
          <span className="landing-cta__art-plane">
            <span className="landing-cta__art-plane-leaf" />
            <span className="landing-cta__art-plane-leaf landing-cta__art-plane-leaf--rose" />
          </span>
          <span className="landing-cta__art-tri" />
        </div>

        {/* Lead-in swatch: rides ABOVE the panel's final top edge until the
            panel lands (own trigger runs in sync with the panel's). */}
        <span className="landing-cta__swatch" aria-hidden="true">
          <span className="landing-cta__swatch-leaf" />
          <span className="landing-cta__swatch-pip" />
          <span className="landing-cta__swatch-dot" />
        </span>
      </div>
    </section>
  );
}
