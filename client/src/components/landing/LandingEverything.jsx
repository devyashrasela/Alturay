import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/*
 * "Everything in One Place" landing section.
 *
 * Composition follows the section reference film:
 *  1. a giant centered heading resolves through a left-to-right cascade of
 *     characters rising into the line;
 *  2. two fragments (doc + chip), anchored to the heading itself, pop in with
 *     a short center-anchored scale once the cascade has finished;
 *  3. the card row enters in normal flow: each card scales up from ~35% about
 *     its own center, left to right, while the middle card stays raised.
 *
 * Nothing is pinned or scrubbed. Decorative elements are aria-hidden and the
 * cards are static illustrations, not controls.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const STAGGER_MS = 18; // delay between consecutive characters
const WORD_GAP_STEPS = 2; // extra "beats" between words (spaces advance the index)
const CHAR_RISE_MS = 380; // must match the .landing-eio__char transform duration

/* Heading text split once at module scope. Spaces are not wrapped in animated
   spans, but they DO advance the stagger index so words get their beat in the
   cascade. Words are atomic inline-blocks so line breaking still happens
   between words at every width. CASCADE_MS is the time at which the last
   character has finished rising; the fragments and lede key off it. */
const TITLE_LINES = ['Everything you need.', 'All in one place.'];
const { TITLE_CHARS, CASCADE_MS } = (() => {
  let index = 0;
  const lines = TITLE_LINES.map((line) =>
    line.split(' ').map((word) => {
      const chars = Array.from(word).map((char) => ({
        char,
        delay: `${index++ * STAGGER_MS}ms`,
      }));
      index += WORD_GAP_STEPS;
      return chars;
    }),
  );
  return { TITLE_CHARS: lines, CASCADE_MS: index * STAGGER_MS + CHAR_RISE_MS };
})();

/* ── Reveal-once hook ──────────────────────────────────────────────────────
   none     → reduced motion / no IntersectionObserver: content just shows.
   armed    → hidden state applied BEFORE first paint (layout effect), so the
              content never flashes visible and then disappears.
   revealed → plays once and stays resolved.

   Reveals when the node intersects OR when it is already above the viewport
   (restored scroll position, deep link below the section, fast scroll), so
   the content can never stay hidden forever. */
function useRevealOnce(ref, rootMargin) {
  const [state, setState] = useState('none');

  useLayoutEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const node = ref.current;
    if (!node) return undefined;

    setState('armed');
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some(
          (entry) => entry.isIntersecting || entry.boundingClientRect.top < 0,
        );
        if (hit) {
          setState('revealed');
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);

    return () => io.disconnect();
  }, [ref, rootMargin]);

  return state;
}

function ProductsPanel() {
  return (
    <div
      className="landing-eio-card__panel landing-eio-card__panel--violet"
      aria-hidden="true"
    >
      <span className="landing-eio-card__label">Product catalog</span>
      <div className="landing-eio-card__rows">
        <div className="landing-eio-card__row">
          <span className="landing-eio-card__swatch landing-eio-card__swatch--gold" />
          <span className="landing-eio-card__row-name">Ceramic mug</span>
          <span className="landing-eio-card__row-price">$22</span>
        </div>
        <div className="landing-eio-card__row">
          <span className="landing-eio-card__swatch landing-eio-card__swatch--rose" />
          <span className="landing-eio-card__row-name">Wool hat</span>
          <span className="landing-eio-card__row-price">$34</span>
        </div>
      </div>
      <span className="landing-eio-card__num">01</span>
      <ArrowRight className="landing-eio-card__arrow" size={17} strokeWidth={2.2} />
    </div>
  );
}

function BillingPanel() {
  return (
    <div
      className="landing-eio-card__panel landing-eio-card__panel--pink"
      aria-hidden="true"
    >
      <span className="landing-eio-card__label">Invoices</span>
      <div className="landing-eio-card__doc">
        <div className="landing-eio-card__doc-head">
          <span className="landing-eio-card__doc-number">INV-2128</span>
          <span className="landing-eio-card__doc-date">Jul 30</span>
        </div>
        <div className="landing-eio-card__doc-line">
          <span>Brand kit</span>
          <span>$290.00</span>
        </div>
        <div className="landing-eio-card__doc-line">
          <span>Landing site</span>
          <span>$480.00</span>
        </div>
        <div className="landing-eio-card__doc-total">
          <span>Total</span>
          <span>$770.00</span>
        </div>
      </div>
      <span className="landing-eio-card__num">02</span>
      <ArrowRight className="landing-eio-card__arrow" size={17} strokeWidth={2.2} />
    </div>
  );
}

function TeamPanel() {
  return (
    <div
      className="landing-eio-card__panel landing-eio-card__panel--yellow"
      aria-hidden="true"
    >
      <span className="landing-eio-card__label">Team members</span>
      <div className="landing-eio-card__team">
        <div className="landing-eio-card__team-biz">
          <span className="landing-eio-card__team-logo" />
          <span>Alturay Studio</span>
        </div>
        <div className="landing-eio-card__team-row">
          <span className="landing-eio-card__team-avatar landing-eio-card__team-avatar--a">AP</span>
          <span className="landing-eio-card__team-name">Ava Park</span>
          <span className="landing-eio-card__team-role landing-eio-card__team-role--owner">Owner</span>
        </div>
        <div className="landing-eio-card__team-row">
          <span className="landing-eio-card__team-avatar landing-eio-card__team-avatar--b">NL</span>
          <span className="landing-eio-card__team-name">Noah Lane</span>
          <span className="landing-eio-card__team-role">Staff</span>
        </div>
        <div className="landing-eio-card__team-more">+2 more</div>
      </div>
      <span className="landing-eio-card__num">03</span>
      <ArrowRight className="landing-eio-card__arrow" size={17} strokeWidth={2.2} />
    </div>
  );
}

const CARDS = [
  {
    title: 'Products',
    description: 'Keep your business’s product catalog organized and easy to manage.',
    panel: <ProductsPanel />,
    modifier: 'landing-eio-card--first',
  },
  {
    title: 'Billing & Invoices',
    description: 'Create professional invoices and keep your billing workflow organized.',
    panel: <BillingPanel />,
    modifier: 'landing-eio-card--middle',
  },
  {
    title: 'Team Access',
    description: 'Give team members access to the businesses they need to work with.',
    panel: <TeamPanel />,
    modifier: 'landing-eio-card--last',
  },
];

export default function LandingEverything() {
  const titleRef = useRef(null);
  const cardsRef = useRef(null);

  // Heading cascade starts when the HEADING (not the whole intro block)
  // reaches the lower third of the viewport; the card row has its own beat.
  const reveal = useRevealOnce(titleRef, '0px 0px -28% 0px');
  const cardsReveal = useRevealOnce(cardsRef, '0px 0px -14% 0px');

  useEffect(() => {
    const targets = [titleRef.current, cardsRef.current].filter(Boolean);
    const page = targets[0]?.closest('.landing-page');
    if (!page) return undefined;

    // Keep the navbar legible while the giant heading OR the card row passes
    // beneath it. The nav is looked up lazily so a late-mounting nav is still
    // found, and the class is toggled only when the state actually changes.
    let nav = null;
    let frame = 0;
    let wasUnder = false;

    const update = () => {
      frame = 0;
      if (!nav || !nav.isConnected) nav = page.querySelector('.landing-nav');
      if (!nav) return;

      const navHeight = nav.getBoundingClientRect().height;
      const under = targets.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < navHeight && rect.bottom > 0;
      });

      if (under !== wasUnder) {
        wasUnder = under;
        page.classList.toggle('is-eio-under-nav', under);
      }
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);

    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      if (frame) window.cancelAnimationFrame(frame);
      page.classList.remove('is-eio-under-nav');
    };
  }, []);

  return (
    <section
      id="everything-in-one-place"
      className={
        `landing-eio` +
        `${reveal === 'armed' ? ' landing-eio--armed' : ''}` +
        `${reveal === 'revealed' ? ' landing-eio--revealed' : ''}` +
        `${cardsReveal === 'armed' ? ' landing-eio--cards-armed' : ''}` +
        `${cardsReveal === 'revealed' ? ' landing-eio--cards-revealed' : ''}`
      }
      style={{ '--eio-cascade': `${CASCADE_MS}ms` }}
      aria-labelledby="landing-eio-title"
    >
      <div className="landing-eio__intro" id="landing-eio-intro">
        <p className="landing-eio__eyebrow">BUILT FOR YOUR BUSINESS</p>

        {/* The fragments live INSIDE this wrapper so they are positioned
            against the heading box itself, not the whole intro block. */}
        <div className="landing-eio__headline">
          <h2 className="landing-eio__title" id="landing-eio-title" ref={titleRef}>
            <span className="landing-eio__sr">Everything you need. All in one place.</span>
            <span aria-hidden="true" className="landing-eio__title-copy">
              {TITLE_CHARS.map((words, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex === 1 ? <br className="landing-eio__break" /> : null}
                  {words.map((chars, wordIndex) => (
                    <Fragment key={wordIndex}>
                      <span className="landing-eio__word">
                        {chars.map((item, charIndex) => (
                          <span
                            key={charIndex}
                            className="landing-eio__char"
                            style={{ transitionDelay: item.delay }}
                          >
                            {item.char}
                          </span>
                        ))}
                      </span>
                      {wordIndex < words.length - 1 ? ' ' : ''}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </span>
          </h2>

          <div className="landing-eio__fragments" aria-hidden="true">
            <div className="landing-eio__frag landing-eio__frag--doc">
              <div className="landing-eio__frag-sheet" />
              <div className="landing-eio__frag-seal" />
            </div>
            <div className="landing-eio__frag landing-eio__frag--chip">
              <span className="landing-eio__frag-monogram">Alturay</span>
            </div>
          </div>
        </div>

        <p className="landing-eio__lede">
          Manage products, create invoices, and bring your team together.
        </p>
      </div>

      <ul className="landing-eio__cards" ref={cardsRef}>
        {CARDS.map((card, index) => (
          <li
            className={`landing-eio-card${card.modifier ? ` ${card.modifier}` : ''}`}
            style={{ '--i': index }}
            key={card.title}
          >
            <div className="landing-eio-card__head">
              <h3 className="landing-eio-card__title">{card.title}</h3>
              <p className="landing-eio-card__desc">{card.description}</p>
            </div>
            {card.panel}
          </li>
        ))}
      </ul>
    </section>
  );
}