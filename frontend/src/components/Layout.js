import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/', label: 'Generate', icon: '✦' },
  { path: '/results', label: 'Results', icon: '◈' },
  { path: '/dashboard', label: 'Dashboard', icon: '◉' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: scrolled ? 'rgba(6,6,15,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.3s ease', padding: '0 1.5rem' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent), var(--gold))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'white' }}>Q</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>QP<span style={{ color: 'var(--accent-light)' }}>Gen</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {NAV_LINKS.map(link => (
              <Link key={link.path} to={link.path} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 500, color: location.pathname === link.path ? 'var(--accent-light)' : 'var(--text-secondary)', background: location.pathname === link.path ? 'var(--accent-dim)' : 'transparent', border: location.pathname === link.path ? '1px solid var(--border-light)' : '1px solid transparent', textDecoration: 'none', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '0.7rem' }}>{link.icon}</span>{link.label}
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 6px var(--success)' }} />API Ready
          </div>
        </div>
      </nav>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        <div className="container">QPGen — AI-Powered Question Paper Generator · Built with Claude API · Bloom's Taxonomy Classification</div>
      </footer>
    </div>
  );
}
