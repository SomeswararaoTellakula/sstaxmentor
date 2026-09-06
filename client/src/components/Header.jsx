import { Link, NavLink, useLocation } from 'react-router-dom';
import { Globe, Phone, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = [
    { to: '/#features', label: 'Features' },
    { to: '/why-us', label: 'WhyUs?' },
    { to: '/gst-registration', label: 'GST Registration' },
    { to: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur border-b border-brand-line">
      <div className="section-wrap flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="SS Tax Mentors — Reach Us &amp; Relax"
            className="h-10 md:h-12 w-auto"
            width="365"
            height="160"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => {
            const sameRoute = l.to.startsWith(location.pathname + '#') || l.to === location.pathname + location.hash;
            if (l.to.startsWith('#') || sameRoute) {
              return (
                <a key={l.to} href={l.to} className="text-sm font-semibold text-brand-text hover:text-brand-blue transition">
                  {l.label}
                </a>
              );
            }
            return (
              <Link key={l.to} to={l.to} className="text-sm font-semibold text-brand-text hover:text-brand-blue transition">
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="tel:+918179726723" className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy">
            <Phone className="w-4 h-4 text-brand-blue" /> +91 8179726723
          </a>
          <NavLink to="/track" className="btn-secondary">Track</NavLink>
          <NavLink to="/admin/login" className="btn-primary">Admin</NavLink>
        </div>

        <button className="md:hidden btn-ghost p-2" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-brand-line bg-white">
          <div className="section-wrap py-4 flex flex-col gap-3">
            {links.map(l => {
              const sameRoute = l.to.startsWith(location.pathname + '#') || l.to === location.pathname + location.hash;
              if (l.to.startsWith('#') || sameRoute) {
                return (
                  <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="text-sm font-semibold py-2">{l.label}</a>
                );
              }
              return (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-semibold py-2">{l.label}</Link>
              );
            })}
            <a href="tel:+918179726723" className="text-sm font-semibold py-2 text-brand-blue">📞 +91 8179726723</a>
            <NavLink to="/track" onClick={() => setOpen(false)} className="btn-secondary justify-center">Track Application</NavLink>
            <NavLink to="/admin/login" onClick={() => setOpen(false)} className="btn-primary justify-center">Admin Login</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
