import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/*
 * "Everything in One Place" landing section.
 *
 * Composition follows the section reference film: a giant centered type
 * moment that resolves through a left-to-right cascade of characters
 * rising into the line, then two fragments that pop in with a short
 * center-anchored scale while the page keeps scrolling normally. The
 * card row rises in normal flow with the first card leading by a small
 * offset before it settles level. Nothing is pinned or scrubbed; all
 * decorative elements are aria-hidden and the cards are static
 * illustrations, not clickable controls.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/* Heading text split once at module scope. Spaces advance the stagger
   index (they give words their beat in the cascade) but are not wrapped
   in animated spans, and words become atomic inline-blocks so line
   breaking still happens between words at every width. */
const TITLE_LINES = ['Everything you need.', 'All in one place.'];
const TITLE_CHARS = (() => {
  let index = 0;
  return TITLE_LINES.map((line) =>
    line.split(' ').map((word) =>
      Array.from(word).map((char) => ({
        char,
        delay: `${index++ * 18}ms`,
      })),
    ),
  );
})();

function PRODUCTS_PANEL() {
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

function BILLING_PANEL() {
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

function TEAM_PANEL() {
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
    panel: PRODUCTS_PANEL(),
    modifier: 'landing-eio-card--first',
  },
  {
    title: 'Billing & Invoices',
    description: 'Create professional invoices and keep your billing workflow organized.',
    panel: BILLING_PANEL(),
    modifier: 'landing-eio-card--middle',
  },
  {
    title: 'Team Access',
    description: 'Give team members access to the businesses they need to work with.',
    panel: TEAM_PANEL(),
    modifier: 'landing-eio-card--last',
  },
];

export default function LandingEverything() {
  const [reveal, setReveal] = useState('none'); // none | armed | revealed
  const [cardsReveal, setCardsReveal] = useState('none'); // none | armed | revealed
  const cardsRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    // The intro reveal mirrors the reference: the character cascade starts
    // when the heading band enters the lower third of the viewport, and it
    // plays once (it keeps its resolved state afterwards).
    const node = document.getElementById('landing-eio-intro');
    if (!node) return undefined;

    let io;
    // Attach the armed state after paint so the entrance transition runs.
    const arm = window.requestAnimationFrame(() => {
      setReveal('armed');
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setReveal('revealed');
            io.disconnect();
          }
        },
        { rootMargin: '0px 0px -28% 0px' },
      );
      io.observe(node);
    });

    return () => {
      window.cancelAnimationFrame(arm);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const node = cardsRef.current;
    if (!node) return undefined;

    // The card row has its own beat: it enters in normal flow, with the
    // first card settling level with the others shortly after the row
    // arrives (measured in both reference films).
    let io;
    const arm = window.requestAnimationFrame(() => {
      setCardsReveal('armed');
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setCardsReveal('revealed');
            io.disconnect();
          }
        },
        { rootMargin: '0px 0px -14% 0px' },
      );
      io.observe(node);
    });

    return () => {
      window.cancelAnimationFrame(arm);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    const title = titleRef.current;
    const nav = document.querySelector('.landing-nav');
    const page = title?.closest('.landing-page');
    if (!title || !nav || !page) return undefined;

    // Keep the navbar legible while the giant heading passes beneath it.
    // Same contextual treatment the hero applies when its artwork reaches
    // the nav (the hero toggles is-hero-art-under-nav).
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = title.getBoundingClientRect();
      const navHeight = nav.getBoundingClientRect().height;
      const under = rect.top < navHeight && rect.bottom > 0;
      page.classList.toggle('is-eio-under-nav', under);
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
      aria-labelledby="landing-eio-title"
    >
      <div className="landing-eio__intro" id="landing-eio-intro">
        <p className="landing-eio__eyebrow">BUILT FOR YOUR BUSINESS</p>

        <h2 className="landing-eio__title" id="landing-eio-title" ref={titleRef}>
          <span className="landing-eio__sr">Everything you need. All in one
            place.</span>
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

        <p className="landing-eio__lede">
          Manage products, create invoices, and bring your team together without
          juggling multiple tools.
        </p>

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

      <ul className="landing-eio__cards" ref={cardsRef}>
        {CARDS.map((card) => (
          <li
            className={`landing-eio-card${card.modifier ? ` ${card.modifier}` : ''}`}
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
