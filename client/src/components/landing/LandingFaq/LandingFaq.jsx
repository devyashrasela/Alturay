import { useEffect, useRef, useState } from 'react';

/*
 * "FAQ" landing section.
 *
 * The reference film plays this section in plain document flow — nothing is
 * pinned. After the previous section's tail row exits, the centered two-line
 * heading and the question-list block ride up INTO view as one shared block
 * (with only a slight in-block trailing bias on the lower rows — never a
 * per-row independent stagger and never a per-word cascade). Rows carry
 * hairline dividers and a light chevron from their first appearance. As the
 * last row exits, it rides ON TOP of the raised nav band (the template's
 * `overflow-x: clip` body clamp look) — no page-level clipping.
 *
 * The film never expands a row; the reference's intent is an accordion, so
 * rows are accessible disclosure buttons whose disclosure animation follows
 * the film's motion language (rise + fade, same ease). Focus is ring-only
 * (no glow), and the expanded chevron rotates 180°.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

/* Suggested copy, adapted to Alturay's current capabilities. Row lengths are
   kept close to the reference's single-line rows so the measured pitch and
   typography stay visually identical. */
const FAQ_ITEMS = [
  {
    q: 'What is Alturay?',
    a: 'Alturay is a business management platform that helps you manage multiple businesses, organize product catalogs, create invoices, and manage team access from one place.',
  },
  {
    q: 'Can I manage multiple businesses with one account?',
    a: 'Yes. Alturay is designed to let you manage multiple businesses from one platform.',
  },
  {
    q: 'Can my team members access a business?',
    a: 'Yes. Alturay supports business memberships and role-based access, so multiple team members can work within a business.',
  },
  {
    q: 'Can I manage products and create invoices?',
    a: 'Yes. Alturay provides product catalog management, billing, and invoice creation capabilities.',
  },
  {
    q: 'Is Alturay suitable for small businesses?',
    a: 'Alturay is designed to simplify everyday business management for small businesses.',
  },
];

function Chevron({ open }) {
  return (
    <svg
      className="landing-faq__chev"
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : undefined }}
    >
      <path
        d="M2 5.2 8 11l6-5.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState(-1);
  const [reveal, setReveal] = useState('none'); // none | armed | revealed
  const introRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const node = headingRef.current;
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
        // Trigger while the heading is still fully below the fold (the film's
        // rise: the block resolves OUT of the bottom edge into the empty band).
        { rootMargin: `-28% 0px 0px 0px` },
      );
      io.observe(node);
    });

    return () => {
      window.cancelAnimationFrame(arm);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
    // Keep the navbar legible while the whole FAQ block (heading + question
    // rows) passes beneath it — the same contextual treatment the hero, the
    // EIO heading, and the MB statement already apply. The flag follows the
    // intro block's own box (heading + rows, exactly the film's moving
    // block) so the rows stay covered during their whole ride under the
    // band. The approved navbar stays untouched.
    const block = introRef.current;
    const nav = document.querySelector('.landing-nav');
    const page = block?.closest('.landing-page');
    if (!block || !nav || !page) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = block.getBoundingClientRect();
      const navHeight = nav.getBoundingClientRect().height;
      const under = rect.top < navHeight && rect.bottom > 0;
      page.classList.toggle('is-faq-under-nav', under);
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
      page.classList.remove('is-faq-under-nav');
    };
  }, []);

  return (
    <section
      id="faq"
      className={
        `landing-faq` +
        `${reveal === 'armed' ? ' landing-faq--armed' : ''}` +
        `${reveal === 'revealed' ? ' landing-faq--revealed' : ''}`
      }
      aria-labelledby="faq-title"
    >
      <div className="landing-faq__intro" ref={introRef}>
        <h2 className="landing-faq__title" id="faq-title" ref={headingRef}>
          <span className="landing-faq__title-line">Frequently Asked</span>
          <span className="landing-faq__title-line landing-faq__title-line--second">
            Questions
          </span>
        </h2>

        <ul className="landing-faq__list">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <li className="landing-faq__item" key={item.q}>
                {index > 0 ? <span className="landing-faq__divider" aria-hidden="true" /> : null}
                <h3 className="landing-faq__q">
                  <button
                    type="button"
                    className="landing-faq__button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? -1 : index)}
                  >
                    <span className="landing-faq__label">{item.q}</span>
                    <Chevron open={open} />
                  </button>
                </h3>
                <div
                  className={`landing-faq__panel${open ? ' is-open' : ''}`}
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                >
                  <div className="landing-faq__panel-inner">
                    <p className="landing-faq__answer">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
