export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-screen">
      <main className="auth-shell">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-brand">
            <img
              className="auth-brand__mark auth-brand__mark--dark"
              src="/alturay_dark.png"
              alt=""
              width="38"
              height="38"
              draggable="false"
            />
            <img
              className="auth-brand__mark auth-brand__mark--light"
              src="/alturay_light.png"
              alt=""
              width="38"
              height="38"
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

        <aside className="auth-art" aria-hidden="true">
          <img
            className="auth-art__image"
            src="/auth-geometric.svg"
            alt=""
            draggable="false"
          />
        </aside>
      </main>
    </div>
  );
}
