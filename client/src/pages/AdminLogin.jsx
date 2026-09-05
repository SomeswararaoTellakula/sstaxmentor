import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Mail as MailIcon, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api.js';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.post('/api/admin/login', { email, password });
      nav('/admin');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Login failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #dde8ff 0%, #f0f4ff 50%, #e8eeff 100%)' }}>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-brand-blue bg-white flex items-center justify-center shadow-sm mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blueLt flex items-center justify-center text-white font-heading font-black text-lg shadow-sm">
              S<span className="text-brand-sky text-sm">T</span>M
            </div>
          </div>
          <span className="text-brand-blue font-heading font-black text-sm tracking-widest uppercase">Admin Panel</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#9BAABF]/40 shadow-lg p-8">
          <h1 className="font-heading font-black text-xl text-brand-navy mb-1">Welcome back</h1>
          <p className="text-brand-muted text-sm mb-7">Sign in to SS Tax Mentors control panel</p>

          {err && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm">{err}</div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">Email</label>
              <div className="relative">
                <MailIcon className="w-4 h-4 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sstaxmentors.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-navy transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button disabled={busy} className="btn-primary w-full py-3 text-base mt-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-brand-muted">
          SS Tax Mentors © {new Date().getFullYear()} · Admin access only
        </p>
      </div>
    </div>
  );
}
