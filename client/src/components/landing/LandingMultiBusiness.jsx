import { Fragment, useRef } from 'react';
import useRevealOnce from '../../pages/Landing/Usesmoothscroll';

/*
 * "Multi-Business" landing section: one large centered paragraph.
 *
 * Reference: each word rises out of its own line mask (no fade), in reading
 * order, left to right and line by line. Two inline icons scale-pop at their
 * slots just after the neighbouring words settle. Plain document flow, no
 * pinning. Everything decorative is aria-hidden; screen readers get the plain
 * sentence once.
 *
 * Copy tokens: {doc} and {orb} are inline icons.
 */
const COPY =
  'Run every business {doc} from one account. Switch workspaces in one click, ' +
  'and each keeps its own products, invoices {orb} and team.';

const WORD_STEP_MS = 38; // reading-order stagger between words
const ICON_EXTRA_MS = 140; // icons pop a beat after their slot's turn

const PLAIN_TEXT = COPY.replace(/\s?\{\w+\}/g, '');

const TOKENS = COPY.split(' ').map((raw, index) => {
  const icon = raw.match(/^\{(\w+)\}$/);
  return {
    id: index,
    icon: icon ? icon[1] : null,
    text: icon ? '' : raw,
    delay: `${index * WORD_STEP_MS + (icon ? ICON_EXTRA_MS : 0)}ms`,
  };
});

export default function LandingMultiBusiness() {
  const statementRef = useRef(null);
  const reveal = useRevealOnce(statementRef, '0px 0px -12% 0px');

  return (
    <section
      id="multi-business"
      className={
        `landing-mb` +
        `${reveal === 'armed' ? ' landing-mb--armed' : ''}` +
        `${reveal === 'revealed' ? ' landing-mb--revealed' : ''}`
      }
      aria-label="Multiple businesses"
    >
      <p className="landing-mb__statement" ref={statementRef}>
        <span className="landing-mb__sr">{PLAIN_TEXT}</span>
        <span aria-hidden="true">
          {TOKENS.map((token, index) => (
            <Fragment key={token.id}>
              {token.icon ? (
                <span
                  className={`landing-mb__icon landing-mb__icon--${token.icon}`}
                  style={{ transitionDelay: token.delay }}
                />
              ) : (
                <span className="landing-mb__w">
                  <span
                    className="landing-mb__w-in"
                    style={{ transitionDelay: token.delay }}
                  >
                    {token.text}
                  </span>
                </span>
              )}
              {index < TOKENS.length - 1 ? ' ' : ''}
            </Fragment>
          ))}
        </span>
      </p>
    </section>
  );
}