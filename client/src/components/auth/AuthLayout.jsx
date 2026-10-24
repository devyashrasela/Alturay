export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-screen">
      <main className="auth-shell">
        <aside className="auth-art" aria-hidden="true">
          <img
            className="auth-art__image"
            src="/auth-artwork.svg"
            alt=""
            draggable="false"
          />
          <span className="auth-art__frame" />

          <div className="auth-art__content">
            <div className="auth-art__label">
              <span>BUILT FOR PROGRESS</span>
              <span className="auth-art__rule" />
            </div>

            <div className="auth-art__quote">
              <h2 className="auth-art__title">
                <span>Build smarter.</span>
                <span>Grow faster.</span>
              </h2>
              <p className="auth-art__text">
                Bring your business together in one place.
              </p>
            </div>
          </div>
        </aside>

        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-brand">
            <img
              className="auth-brand__mark auth-brand__mark--dark"
              src="/alturay_dark.png"
              alt=""
              width="34"
              height="34"
              draggable="false"
            />
            <img
              className="auth-brand__mark auth-brand__mark--light"
              src="/alturay_light.png"
              alt=""
              width="34"
              height="34"
              draggable="false"
            />
            <span className="auth-brand__name">Alturay</span>
          </div>

          <div className="auth-panel__content">
            <header className="auth-head">
              <h1 className="auth-head__title" id="auth-title">{title}</h1>
              <p className="auth-head__subtitle">{subtitle}</p>
            </header>

            {children}
          </div>

          <footer className="auth-panel__footer">{footer}</footer>
        </section>
      </main>
    </div>
  );
}
