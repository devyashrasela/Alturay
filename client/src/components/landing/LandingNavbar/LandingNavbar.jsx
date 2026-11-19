import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#everything-in-one-place' },
  { label: 'Businesses', href: '#multi-business' },
  { label: 'FAQ', href: '#faq' },
];

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (headerRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="landing-nav" ref={headerRef}>
      <div className="landing-nav__inner">
        <Link className="landing-nav__brand" to="/" aria-label="Alturay home">
          <img
            className="landing-nav__mark"
            src="/alturay_dark.png"
            alt=""
            width="40"
            height="40"
            draggable="false"
          />
          <span className="landing-nav__wordmark">Alturay</span>
        </Link>

        <nav className="landing-nav__links" aria-label="Landing page sections">
          {NAV_LINKS.map((link) => (
            <a className="landing-nav__link" href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-nav__end">
          <div className="landing-nav__actions">
            <Link className="landing-nav__login" to="/login">
              Log in
            </Link>
            <Link className="landing-nav__cta" to="/register">
              Get Started
            </Link>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className={`landing-nav__toggle${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="landing-nav__toggle-icon" aria-hidden="true">
              <Menu className="landing-nav__toggle-menu" size={20} strokeWidth={2} />
              <X className="landing-nav__toggle-close" size={20} strokeWidth={2} />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`landing-nav__mobile${menuOpen ? ' is-open' : ''}`}
        id="landing-mobile-menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav aria-label="Landing page sections">
          {NAV_LINKS.map((link) => (
            <a
              className="landing-nav__mobile-link"
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-nav__mobile-actions">
          <Link className="landing-nav__mobile-login" to="/login" onClick={closeMenu}>
            Log in
          </Link>
          <Link
            className="landing-nav__cta landing-nav__cta--mobile"
            to="/register"
            onClick={closeMenu}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
