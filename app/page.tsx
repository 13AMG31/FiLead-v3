import Image from "next/image";
import Link from "next/link";

const features = [
  { number: "01", title: "Clientes que regresan", text: "Una tarjeta digital sencilla para que tus clientes acumulen visitas y tengan una razón para volver." },
  { number: "02", title: "Recompensas a tu manera", text: "Elige cuántos sellos necesitan y qué premio reciben. Tu negocio pone las reglas." },
  { number: "03", title: "Todo desde un solo lugar", text: "Consulta clientes, compras y canjes desde un panel pensado para usarse también en el teléfono." },
];

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Fi.Lead inicio">
          <Image src="/fi-lead-logo.png" alt="Fi.Lead" width={150} height={58} priority />
        </Link>
        <nav className="header-actions" aria-label="Navegación principal">
          <Link className="nav-link" href="/demo">Ver ejemplo</Link>
          <Link className="button button-small" href="/admin">Entrar al panel <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="hero-home hero-rebrand">
        <div className="hero-copy">
          <span className="eyebrow eyebrow-light">Fidelización simple para negocios locales</span>
          <h1>Haz que cada visita <span>cuente.</span></h1>
          <p>Fi.Lead ayuda a cafeterías y pequeños negocios a convertir clientes ocasionales en clientes frecuentes con tarjetas de lealtad digitales, sellos y recompensas.</p>
          <div className="hero-actions">
            <Link className="button button-light" href="/admin">Probar Fi.Lead <span aria-hidden="true">→</span></Link>
            <Link className="hero-text-link" href="/demo">Explorar una demostración</Link>
          </div>
          <div className="hero-note"><span className="note-dot" /> Prueba interactiva · No requiere conectar una cuenta
          </div>
        </div>
        <div className="loyalty-preview" aria-label="Vista ilustrativa de una tarjeta de fidelización">
          <div className="preview-top"><span>fi.lead / CLUB</span><span className="preview-spark">✳</span></div>
          <p className="preview-kicker">TU PRÓXIMO PREMIO</p>
          <h2>Una visita más<br />y es tuyo.</h2>
          <div className="preview-stamps"><i>✓</i><i>✓</i><i>✓</i><i>✓</i><i>✓</i><i>＋</i></div>
          <div className="preview-bottom"><span>5 de 6 visitas</span><span>CAFÉ + CONEXIÓN</span></div>
        </div>
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
      </section>

      <section className="intro-strip">
        <p>Una experiencia clara para tu equipo. Una recompensa atractiva para tus clientes.</p>
        <span>DISEÑADO PARA EL DÍA A DÍA</span>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <span className="eyebrow">Menos complicaciones, más lealtad</span>
          <h2>Todo lo esencial.<br /><span>Sin enredos.</span></h2>
          <p>Empieza con lo importante: registra visitas, reconoce a tus clientes y administra tus recompensas con facilidad.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <div className="feature-mark">{feature.number === "01" ? "♡" : feature.number === "02" ? "✳" : "↗"}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="soft-cta">
        <div><span className="eyebrow">Empieza con una prueba</span><h2>Tu programa de lealtad<br />puede ser así de simple.</h2></div>
        <Link className="button" href="/admin">Abrir demostración <span aria-hidden="true">→</span></Link>
      </section>
      <footer className="site-footer"><span>Fi.Lead © 2026</span><span>Fidelización que conecta.</span><span>Versión de prueba · Datos locales</span></footer>
    </main>
  );
}
