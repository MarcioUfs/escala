import { useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="home-page">
      <style>{`
        .home-page {
          --primary-color: #1e3a8a;
          --primary-hover: #1d4ed8;
          --admin-color: #0f766e;
          --admin-hover: #0d9488;
          --bg-color: #f8fafc;
          --surface-color: #ffffff;
          --text-main: #0f172a;
          --text-muted: #475569;
          --border-color: #e2e8f0;
          --ad-bg: #f1f5f9;
          --ad-border: #cbd5e1;
          --radius: 8px;
          --shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: var(--bg-color);
          color: var(--text-main);
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .home-page .header {
          background-color: var(--surface-color);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: var(--shadow);
        }

        .home-page .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .home-page .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
          text-decoration: none;
        }

        .home-page .auth-buttons-desktop {
          display: flex;
          gap: 0.75rem;
        }

        .home-page .btn {
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          font-weight: 600;
          text-decoration: none;
          font-size: 0.875rem;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s, transform 0.1s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .home-page .btn:active { transform: scale(0.98); }

        .home-page .btn-user { background-color: var(--primary-color); color: #ffffff; }
        .home-page .btn-user:hover { background-color: var(--primary-hover); }

        .home-page .btn-admin { background-color: var(--admin-color); color: #ffffff; }
        .home-page .btn-admin:hover { background-color: var(--admin-hover); }

        .home-page .hamburger {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-main);
          padding: 0.5rem;
        }

        .home-page .mobile-menu {
          display: none;
          flex-direction: column;
          background-color: var(--surface-color);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem;
          gap: 0.75rem;
        }

        .home-page .mobile-menu.active { display: flex; }

        .home-page .layout-grid {
          display: grid;
          grid-template-columns: 250px 1fr 250px;
          gap: 1.5rem;
          max-width: 1400px;
          margin: 1.5rem auto;
          padding: 0 1rem;
          flex: 1;
        }

        .home-page .aside-ad { display: block; }

        .home-page .ad-card {
          background-color: var(--ad-bg);
          border: 1px dashed var(--ad-border);
          border-radius: var(--radius);
          padding: 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          position: sticky;
          top: 5rem;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .home-page .mobile-ad-banner {
          display: none;
          background-color: var(--ad-bg);
          border: 1px dashed var(--ad-border);
          border-radius: var(--radius);
          padding: 0.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.75rem;
          margin-top: 1.5rem;
        }

        .home-page .main-content {
          background-color: var(--surface-color);
          border-radius: var(--radius);
          padding: 2rem;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
        }

        .home-page .article-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .home-page .article-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: var(--radius);
          flex-shrink: 0;
        }

        .home-page .article-title {
          font-size: 1.875rem;
          line-height: 1.25;
          color: var(--text-main);
        }

        .home-page .article-body {
          color: var(--text-muted);
          font-size: 1.05rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .home-page .footer {
          background-color: var(--surface-color);
          border-top: 1px solid var(--border-color);
          text-align: center;
          padding: 1.5rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: auto;
        }

        @media (max-width: 1024px) {
          .home-page .layout-grid { grid-template-columns: 1fr; }
          .home-page .aside-ad { display: none; }
          .home-page .auth-buttons-desktop { display: none; }
          .home-page .hamburger { display: block; }
          .home-page .mobile-ad-banner { display: block; }
          .home-page .main-content { padding: 1.25rem; }
          .home-page .article-header { flex-direction: row; }
        }

        @media (max-width: 640px) {
          .home-page .article-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .home-page .article-image { width: 100%; height: 200px; }
          .home-page .article-title { font-size: 1.5rem; }
        }
      `}</style>

      {/* CABEÇALHO */}
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">E-Escala</Link>

          {/* Botões visíveis em telas grandes */}
          <div className="auth-buttons-desktop">
            <Link to="/login" className="btn btn-user">Área do Usuário</Link>
            <Link to="/login-admin" className="btn btn-admin">Área do Admin</Link>
          </div>

          {/* Hambúrguer (mobile/tablet) */}
          <button
            className="hamburger"
            aria-label="Abrir Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            &#9776;
          </button>
        </div>

        {/* Menu mobile */}
        <nav className={`mobile-menu ${menuOpen ? "active" : ""}`}>
          <Link to="/login" className="btn btn-user" onClick={() => setMenuOpen(false)}>
            Área do Usuário
          </Link>
          <Link to="/login-admin" className="btn btn-admin" onClick={() => setMenuOpen(false)}>
            Área do Admin
          </Link>
        </nav>
      </header>

      {/* GRID PRINCIPAL */}
      <div className="layout-grid">
        <aside className="aside-ad">
          <div className="ad-card">
            <p><strong>Espaço Publicitário</strong></p>
            <p>Google Ads / Banner Lateral (250x600)</p>
          </div>
        </aside>

        <main className="main-content">
          <article>
            <header className="article-header">
              <img
                src="https://picsum.photos/200/200"
                alt="Imagem Ilustrativa"
                className="article-image"
              />
              <h1 className="article-title">
                Bem-vindo ao Sistema E-Escala
              </h1>
            </header>

            <section className="article-body">
              <p>
                Plataforma de gestão de escalas para a organização, com controle de turnos,
                guarnições e efetivo em um só lugar.
              </p>
              <p>
                Acesse pela Área do Usuário para consultar sua escala, ou pela Área do Admin
                para gerenciar o sistema.
              </p>
            </section>
          </article>

          <div className="mobile-ad-banner">
            <p><strong>Publicidade:</strong> Confira as melhores ofertas parceiras do mês.</p>
          </div>
        </main>

        <aside className="aside-ad">
          <div className="ad-card">
            <p><strong>Espaço Publicitário</strong></p>
            <p>Google Ads / Banner Lateral (250x600)</p>
          </div>
        </aside>
      </div>

      <footer className="footer">
        <p>&copy; 2026 E-Escala. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}