import { Fragment, useEffect, useRef, useState } from 'react';

/*
 * "Multi-Business" landing section.
 *
 * The reference film plays this section in plain document flow — nothing is
 * pinned or scrubbed. A large statement resolves through a left-to-right
 * cascade of its words (rising from below with a fade, an inline fragment
 * scale-popping at its slot), then three stat rows ride in on the scroll:
 * each row carries an illustration card that scales up from ~30%, a giant
 * number that counts up once as the row enters, a rotated chip that pops
 * over the number near the end of the count, and a caption that fades in
 * as the count settles. Rows observe their own entry so their counts can
 * start independently, like the reference. Reveal states are one-shot
 * (armed/in states persist on reverse scroll) while all flow motion stays
 * naturally reversible. Everything decorative is aria-hidden and the rows
 * are static exhibits, not controls.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/* Statement parts at module scope. Words rise on a shared reading-order
   stagger across both lines; the violet chip pops just after its line-1
   slot settles, echoing the reference's inline fragment beats. */
const STATEMENT_STEP_MS = 48;
const STATEMENT_LINE_OFFSET_MS = 130;
const STATEMENT_CHIP_DELAY_MS = 300;
const STATEMENT_LINES = [
  [
    { kind: 'word', text: 'Every', delay: '0ms' },
    { kind: 'word', text: 'business.', delay: `${STATEMENT_STEP_MS}ms` },
    { kind: 'chip', delay: `${STATEMENT_CHIP_DELAY_MS}ms` },
  ],
  [
    { kind: 'word', text: 'One', delay: `${2 * STATEMENT_STEP_MS + STATEMENT_LINE_OFFSET_MS}ms` },
    { kind: 'word', text: 'place.', delay: `${3 * STATEMENT_STEP_MS + STATEMENT_LINE_OFFSET_MS}ms` },
  ],
];
const STATEMENT_SR = 'Every business. One place.';

/* Row exhibits. Numbers and chips trace to artwork already approved in
   this landing (multiple businesses per account, the studio's member
   count, the single-login switcher) — no invented traction figures. */
const STATS = [
  {
    value: 3,
    chip: 'Businesses',
    chipTheme: 'yellow',
    caption:
      'Businesses live side by side in your account — switch from the workspace menu whenever you need.',
  },
  {
    value: 4,
    chip: 'Members',
    chipTheme: 'violet',
    caption:
      'Give team members access to the businesses they need to work with.',
  },
  {
    value: 1,
    chip: 'Account',
    chipTheme: 'rose',
    caption:
      'One login holds every business — products, invoices, and team access included.',
  },
];

const COUNT_DURATION_MS = 1000;
const COUNT_CHIP_DELAY_MS = 660;

function easeOutExpo(progress) {
  return progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
}

/* Giant number counting up once while its row enters. Reduced motion
   renders the final value immediately. */
function CountUpValue({ value, active }) {
  const [display, setDisplay] = useState(active || REDUCED_MOTION ? value : 0);
  const frame = useRef(0);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined; // Initial state is already final.
    if (!active) return undefined;

    let start = null;
    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / COUNT_DURATION_MS);
      setDisplay(Math.round(value * easeOutExpo(progress)));
      if (progress < 1) frame.current = window.requestAnimationFrame(step);
    };
    frame.current = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frame.current);
  }, [active, value]);

  return (
    <span
      className="landing-mb-row__num"
      style={{ minWidth: `${String(value).length}ch` }}
    >
      {display}
    </span>
  );
}

/* Illustrative art cards — flat brand-toned compositions, not screenshots
   of the application. Separate tiny artworks per row, aria-hidden. */
function BusinessesArt() {
  return <span className="landing-mb-row__art" aria-hidden="true" data-art="violet" />;
}

function MembersArt() {
  return <span className="landing-mb-row__art" aria-hidden="true" data-art="rose" />;
}

function AccountArt() {
  return <span className="landing-mb-row__art" aria-hidden="true" data-art="gold" />;
}

export default function LandingMultiBusiness() {
  const [reveal, setReveal] = useState('none'); // none | armed | revealed
  const [statsArmed, setStatsArmed] = useState(false);
  const [rowsIn, setRowsIn] = useState(
    REDUCED_MOTION ? STATS.map((_, index) => index) : [],
  );
  const statsRef = useRef(null);
  const statementRef = useRef(null);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    // The statement cascades as soon as it pokes above the fold, like the
    // film where the cascade consumes most of the block's rise.
    const node = document.getElementById('landing-mb-statement');
    if (!node) return undefined;

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
        { rootMargin: '0px 0px -4% 0px' },
      );
      io.observe(node);
    });

    return () => {
      window.cancelAnimationFrame(arm);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined; // rowsIn already holds every row.
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const root = statsRef.current;
    if (!root) return undefined;

    setStatsArmed(true);

    // Each stat row owns its beat: its card scales up and its number counts
    // as the row's head enters, so separate counts can run simultaneously.
    const rowNodes = Array.from(root.children);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = rowNodes.indexOf(entry.target);
          if (index >= 0) {
            setRowsIn((current) => (current.includes(index) ? current : [...current, index]));
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    rowNodes.forEach((row) => io.observe(row));

    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
    // Keep the navbar legible while the giant statement passes beneath it
    // — the same contextual treatment the hero and the Everything-in-One-
    // Place heading already apply. Colors and layout of the approved
    // navbar stay untouched; only a backdrop is raised.
    const title = statementRef.current;
    const nav = document.querySelector('.landing-nav');
    const page = title?.closest('.landing-page');
    if (!title || !nav || !page) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = title.getBoundingClientRect();
      const navHeight = nav.getBoundingClientRect().height;
      const under = rect.top < navHeight && rect.bottom > 0;
      page.classList.toggle('is-mb-under-nav', under);
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
      page.classList.remove('is-mb-under-nav');
    };
  }, []);

  return (
    <section
      id="multi-business"
      className={
        `landing-mb` +
        `${reveal === 'armed' ? ' landing-mb--armed' : ''}` +
        `${reveal === 'revealed' ? ' landing-mb--revealed' : ''}` +
        `${statsArmed ? ' landing-mb--stats-armed' : ''}`
      }
      aria-labelledby="landing-mb-statement"
    >
      <div className="landing-mb__intro">
        <p className="landing-mb__eyebrow">One platform. Multiple businesses.</p>
        <h2
          className="landing-mb__statement"
          id="landing-mb-statement"
          ref={statementRef}
        >
          <span className="landing-mb__sr">{STATEMENT_SR}</span>
          <span aria-hidden="true" className="landing-mb__statement-copy">
            {STATEMENT_LINES.map((line, lineIndex) => (
              <span className="landing-mb__statement-line" key={lineIndex}>
                {line.map((part, partIndex) => (
                  <Fragment
                    key={part.kind === 'chip' ? `chip-${lineIndex}-${partIndex}` : part.text}
                  >
                    {part.kind === 'chip' ? (
                      <span
                        className="landing-mb__chip"
                        style={{ transitionDelay: part.delay }}
                      >
                        <span className="landing-mb__chip-doc" />
                      </span>
                    ) : (
                      <span
                        className="landing-mb__word"
                        style={{ transitionDelay: part.delay }}
                      >
                        {part.text}
                      </span>
                    )}
                    {partIndex < line.length - 1 ? ' ' : ''}
                  </Fragment>
                ))}
              </span>
            ))}
          </span>
        </h2>
        <p className="landing-mb__lede">
          Manage your businesses from one platform, with the products, billing,
          and team access each business needs.
        </p>
      </div>

      <ul className="landing-mb__stats" ref={statsRef}>
        {STATS.map((stat, index) => (
          <li
            className={
              `landing-mb-row` +
              `${rowsIn.includes(index) ? ' landing-mb-row--in' : ''}`
            }
            key={stat.chip}
          >
            {index === 0 ? <BusinessesArt /> : null}
            {index === 1 ? <MembersArt /> : null}
            {index === 2 ? <AccountArt /> : null}
            <div className="landing-mb-row__figure">
              <span className="landing-mb__sr">
                {`${stat.value} ${stat.chip.toLowerCase()}`}
              </span>
              <span
                aria-hidden="true"
                className="landing-mb-row__figure-box"
                style={{ '--mb-chip-delay': `${COUNT_CHIP_DELAY_MS}ms` }}
              >
                <span
                  className={
                    `landing-mb-row__chip landing-mb-row__chip--${stat.chipTheme}`
                  }
                >
                  {stat.chip}
                </span>
                <CountUpValue value={stat.value} active={rowsIn.includes(index)} />
              </span>
            </div>
            <p className="landing-mb-row__caption">{stat.caption}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
