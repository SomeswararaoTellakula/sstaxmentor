import { Link } from 'react-router-dom';
import StatChip from '../components/StatChip.jsx';
import { Zap, Shield, Users, Clock, ArrowRight, CheckCircle2, FileCheck, Award, Star, Phone } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning‑fast filing',
    desc: 'Most ARNs issued within 24 hours of complete document submission through our direct GSTN‑ready workflow.',
  },
  {
    icon: Shield,
    title: 'PII encrypted at rest',
    desc: 'Aadhaar data is AES‑256‑GCM encrypted in the database and always masked (XXXX XXXX 1234) in dashboards & logs.',
  },
  {
    icon: Users,
    title: 'Pan‑India coverage',
    desc: 'Registrations filed across all 36 Indian States / UTs — from J&K to Andaman, Tier 1 towns to rural pin codes.',
  },
  {
    icon: Clock,
    title: 'Human review, always',
    desc: 'Every single form is reviewed by a GST practitioner before filing — no bot‑only handoff, no last‑minute mismatches.',
  },
  {
    icon: FileCheck,
    title: 'Tracked till GSTIN',
    desc: 'We don\'t disappear after the ARN. Queries, officer follow‑ups, and certificate delivery — all handled end‑to‑end.',
  },
  {
    icon: Award,
    title: '99% first‑pass success',
    desc: 'Proper pre‑filing checks mean fewer GSTN rejections. Our first‑time pass rate speaks for itself across 2000+ filings.',
  },
];

const whyusHome = [
  { label: 'Dedicated POC', detail: 'One GST practitioner — from upload to GSTIN, no handoffs, no repeat explanations.' },
  { label: '7‑day query window covered', detail: 'GST officer queries drafted, packaged, and submitted within the response window.' },
  { label: 'Fixed fee, no surprises', detail: 'Included: 2 reworks, query response drafting, acknowledgement, and certificate delivery.' },
  { label: '3‑channel support', detail: 'Phone · Email · WhatsApp — the same human on all three, 6 days a week.' },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-bgSoft to-white py-16 md:py-24">
        <div className="section-wrap grid md:grid-cols-2 items-center gap-12">
          <div>
            <p className="kicker mb-5">Fast &amp; Hassle-Free</p>
            <h1 className="font-heading font-black text-brand-navy text-4xl md:text-5xl leading-[1.05] tracking-tight mb-5">
              Online GST Registration<br />
              <span className="text-brand-blue">Made Simple</span>
            </h1>
            <p className="text-brand-muted text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              Get your business GST‑registered quickly with SS Tax Mentors. Our experts handle paperwork, verification, and filing so you can focus on growth.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/gst-registration" className="btn-primary">Start Registration</Link>
              <Link to="/track" className="btn-secondary">Track Application</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatChip>2000+ GSTs Registered</StatChip>
              <StatChip>3‑7 Days Turnaround</StatChip>
              <StatChip>100% Online Process</StatChip>
              <StatChip>Pan‑India Service</StatChip>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <img src="/hero.svg" alt="GST Registration Illustration" className="w-full max-w-md drop-shadow-xl" />
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-20 bg-brand-bgSoft border-y border-brand-line scroll-mt-24">
        <div className="section-wrap">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="kicker mb-4">What you get</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-navy mb-4">
              Everything your business needs for a smooth GST registration
            </h2>
            <p className="text-brand-muted">
              Six non‑negotiable features included in every registration package — no upsells, no tiers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-7 hover:border-brand-blue/40 transition">
                  <div className="w-12 h-12 rounded-2xl bg-brand-amber/10 text-brand-amber flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-black text-brand-navy text-lg md:text-xl mb-2.5 leading-snug">{f.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="whyus" className="py-16 md:py-24 scroll-mt-24">
        <div className="section-wrap">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy/95 to-brand-blue text-white p-8 md:p-10 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-25" style={{
                  background: 'radial-gradient(circle at 15% 15%, rgba(255,192,72,.4), transparent 45%), radial-gradient(circle at 90% 85%, rgba(123,156,245,.35), transparent 40%)'
                }} />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest mb-6">
                    <Star className="w-3.5 h-3.5 text-brand-amber fill-current" />
                    Est. 2016 · 9 yrs in practice
                  </div>
                  <div className="font-heading font-black text-5xl md:text-6xl leading-none text-brand-amber mb-3">2000+</div>
                  <div className="font-heading font-black text-2xl md:text-3xl tracking-wide mb-8">Happy Business Clients</div>
                  <div className="space-y-4 text-sm">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur">
                      <div className="font-heading font-black text-lg mb-1">Last 12 months</div>
                      <div className="text-white/80">2000+ registrations filed · 92% issued within 7 days · 0 unresolved query cases</div>
                    </div>
                    <a href="tel:+918179726723" className="inline-flex items-center gap-2 text-brand-amber hover:text-white transition font-semibold">
                      <Phone className="w-4 h-4" /> +91 8179726723 — talk to a practitioner
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="kicker mb-4">Why SS Tax Mentors</p>
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-navy mb-5 leading-tight">
                Compliance isn't a feature.<br />
                <span className="text-brand-blue">It's the baseline.</span>
              </h2>
              <p className="text-brand-muted leading-relaxed mb-8">
                The difference between a good registration service and a great one isn't the form — it's everything after.
                Practitioner review, query handling, certificate delivery, and a number you can call when something goes wrong.
              </p>

              <ul className="space-y-4 mb-10">
                {whyusHome.map((w) => (
                  <li key={w.label} className="flex items-start gap-4">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-brand-ok/10 text-brand-ok flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-heading font-black text-brand-navy leading-snug">{w.label}</div>
                      <div className="text-sm text-brand-muted mt-0.5">{w.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link to="/why-us" className="inline-flex items-center gap-2 btn-primary">
                  Read why clients choose us <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/gst-registration" className="btn-secondary">
                  Start Registration
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
