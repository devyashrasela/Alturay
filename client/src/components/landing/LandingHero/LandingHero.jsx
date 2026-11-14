import { Link } from 'react-router-dom';
import { FileText, Package, Users } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero__copy">
        <h1 className="landing-hero__title" id="landing-hero-title">
          Simplify the way you
          <br className="landing-hero__break" />{' '}
          manage your business.
        </h1>
        <p className="landing-hero__lede">
          Bring products, billing, and multiple businesses together in one simple platform.
        </p>
        <Link className="landing-hero__cta" to="/register">
          Get Started
        </Link>
      </div>

      <div className="landing-hero__art" aria-hidden="true">
        <div className="landing-hero__stack">
          <div className="landing-hero__back landing-hero__back--yellow" />
          <div className="landing-hero__back landing-hero__back--pink" />

          <div className="landing-hero__panel">
            <div className="landing-hero__texture" />

            <svg
              className="landing-hero__threads"
              viewBox="0 0 1320 650"
              preserveAspectRatio="none"
              focusable="false"
            >
              <path d="M-60 500C185 350 395 514 610 392S968 164 1380 268" />
              <path d="M-20 162C232 224 424 82 648 156S1042 374 1340 296" />
              <circle cx="930" cy="230" r="3.5" />
              <circle cx="384" cy="454" r="3" />
            </svg>

            <div className="landing-hero__orbit landing-hero__orbit--lg" />
            <div className="landing-hero__orbit landing-hero__orbit--sm" />

            <div className="landing-hero__logo">
              <img
                src="/alturay_light.png"
                alt=""
                width="96"
                height="96"
                draggable="false"
              />
            </div>

            <div className="landing-hero__ui landing-hero__ui--products">
              <div className="landing-hero__ui-head">
                <span className="landing-hero__ui-icon">
                  <Package size={12} strokeWidth={2.1} />
                </span>
                <span className="landing-hero__ui-title">Products</span>
                <span className="landing-hero__ui-chip">12</span>
              </div>
              <div className="landing-hero__product-row">
                <span className="landing-hero__swatch landing-hero__swatch--gold" />
                <span className="landing-hero__product-name">Desk lamp</span>
                <span className="landing-hero__product-price">$48</span>
              </div>
              <div className="landing-hero__product-row">
                <span className="landing-hero__swatch landing-hero__swatch--rose" />
                <span className="landing-hero__product-name">Linen shirt</span>
                <span className="landing-hero__product-price">$32</span>
              </div>
            </div>

            {/* Illustrative interface fragments — not live product captures. */}
            <div className="landing-hero__ui landing-hero__ui--invoice">
              <div className="landing-hero__ui-head">
                <span className="landing-hero__ui-icon">
                  <FileText size={12} strokeWidth={2.1} />
                </span>
                <span className="landing-hero__ui-title">Invoice</span>
                <span className="landing-hero__invoice-status">Paid</span>
              </div>
              <div className="landing-hero__invoice-meta">
                <span className="landing-hero__invoice-number">INV-024</span>
                <span>Jun 12</span>
              </div>
              <div className="landing-hero__invoice-amount">$1,240.00</div>
              <div className="landing-hero__invoice-foot">
                <span>Northline Studio</span>
                <span>Billing</span>
              </div>
            </div>

            <div className="landing-hero__ui landing-hero__ui--access">
              <div className="landing-hero__ui-head">
                <span className="landing-hero__ui-icon">
                  <Users size={12} strokeWidth={2.1} />
                </span>
                <span className="landing-hero__ui-title">Business access</span>
              </div>
              <div className="landing-hero__access-body">
                <div className="landing-hero__avatars">
                  <span className="landing-hero__avatar">MK</span>
                  <span className="landing-hero__avatar">JL</span>
                  <span className="landing-hero__avatar">+2</span>
                </div>
                <div className="landing-hero__access-meta">
                  <span className="landing-hero__access-name">Alturay Studio</span>
                  <span>4 members</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
