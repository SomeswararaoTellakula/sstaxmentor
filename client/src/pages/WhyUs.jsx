import { Link } from 'react-router-dom';
import { Shield, UserCheck, Clock, FileCheck2, Award, Headphones, IndianRupee, CheckCircle2, ArrowRight, Star, Phone, Mail, Globe } from 'lucide-react';

const pillars = [
  {
    icon: Shield,
    title: 'End‑to‑End Data Security',
    desc: 'Your Aadhaar, PAN, and financial documents are AES‑256 encrypted at rest, masked in logs, and transmitted over TLS 1.3. Zero plaintext PII ever leaves our systems unprotected.',
    tag: 'ISO‑Grade Security',
  },
  {
    icon: UserCheck,
    title: 'Dedicated GST Practitioners',
    desc: 'Every application is reviewed by a qualified GST professional — not an automated bot. We spot mismatches, correct typos, and validate supporting documents before any filing.',
    tag: 'Human-in-the-Loop',
  },
  {
    icon: Clock,
    title: '3–7 Day Turnaround (Real)',
    desc: 'Most agents promise “24 hours” and then take weeks. Our median registration time from document submission to ARN generation is 3 working days, with 92% completed within 7 days.',
    tag: 'Verified SLAs',
  },
  {
    icon: FileCheck2,
    title: 'ARN → GSTIN Tracking Until Approval',
    desc: 'Most services stop once they generate your ARN. We continue to monitor your application through the GSTN portal, flag mismatches, notify you of queries, and follow up until the GSTIN is issued.',
    tag: 'True End‑to‑End',
  },
  {
    icon: IndianRupee,
    title: 'Transparent, Zero‑Hidden Fees',
    desc: 'No “processing fees”, no “courier charges”, no surprise upgrades. Every service tier lists the exact inclusions. If your application requires rework, we absorb the cost — not you.',
    tag: 'Fixed‑Price Promise',
  },
  {
    icon: Headphones,
    title: 'Priority Support (WhatsApp + Call + Email)',
    desc: 'Reach a human within one business hour across three channels. WhatsApp replies go to a dedicated executive, not a bot. You get the same point‑of‑contact from day one to GSTIN.',
    tag: 'Human Support',
  },
];

const timeline = [
  { step: 1, label: 'Document Collection', desc: 'You upload Aadhaar, PAN, photo, and electricity bill through the secure form. All files are virus‑scanned and validated server‑side.' },
  { step: 2, label: 'Practitioner Review', desc: 'A GST expert verifies every field against the GSTN schema. Missing fields, name mismatches, and address typos are corrected with your approval.' },
  { step: 3, label: 'Draft & E‑Sign Prep', desc: 'We generate the GST REG‑01 draft, attach a digitally‑signed acknowledgement, and prepare the EVC / DSC workflow for your registered mobile.' },
  { step: 4, label: 'Filing & ARN Issued', desc: 'The completed form is filed with the GSTN portal. An Application Reference Number (ARN) is usually generated within 24 hours and sent to your email / WhatsApp.' },
  { step: 5, label: 'Query Resolution (If Any)', desc: 'If the GST officer raises a query — for example proof of premises — we prepare the correct response package and submit it within the 7‑day window.' },
  { step: 6, label: 'GSTIN Delivery', desc: 'Once the certificate is issued, we send the GSTIN, provisional ID, and a signed Registration Certificate PDF via email, WhatsApp, and your dashboard.' },
];

const differentiators = [
  { a: 'Typical GST Agents', b: 'SS Tax Mentors', data: [
    ['Bot‑only validation, human review as paid extra', 'Senior GST practitioner reviews every file by default'],
    ['ARN issued — engagement ends', 'Tracked through ARN → queries → GSTIN certificate'],
    ['Queries billed hourly', 'Query‑response packaging is always included'],
    ['Support replies in 24–72 hours', 'Median first response under 60 minutes'],
    ['Partial Aadhaar masking in dashboards', 'AES‑256 + full masked display everywhere (XXXX XXXX 1234)'],
    ['Hidden charges for rework / revisions', 'Fixed fee — rework, re‑submissions, and corrections included'],
  ]},
];

const stats = [
  { num: '9 yrs', label: 'Est. 2016 · Tax Practitioners' },
  { num: '2000+', label: 'Active Business Clients' },
  { num: '4500+', label: 'GST Registrations Filed' },
  { num: '99.2%', label: 'First‑Pass Filing Success' },
  { num: '92%', label: 'Completed within 7 days' },
  { num: '36/36', label: 'Indian States & UTs Served' },
];

export default function WhyUs() {
  return (
    <div>
      <section className="bg-brand-navy text-white py-16 md:py-24 relative overflow-hidden border-b border-brand-line">
        <div className="absolute inset-0 opacity-20" style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(255,192,72,.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(123,156,245,.35), transparent 45%)'
        }} />
        <div className="section-wrap relative">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-amber mb-4">Why SS Tax Mentors</p>
            <h1 className="font-heading font-black text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6">
              <span className="text-brand-amber">The tax compliance partner</span><br />
              <span className="text-brand-amber">you actually speak to.</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8">
              Thousands of GST registrations start every day in India. Only a handful get reviewed by a qualified practitioner, tracked past the ARN, and resolve queries before the 7‑day window closes.
              That's the difference we've built since 2016.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/gst-registration" className="inline-flex items-center gap-2 bg-brand-amber text-brand-navy hover:bg-brand-amber/90 font-bold rounded-xl px-6 py-3 transition">
                Start My Registration <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 border border-white/25 hover:border-white/50 text-white rounded-xl px-6 py-3 font-semibold transition">
                Talk to a Practitioner
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-16">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
                <div className="font-heading font-black text-brand-amber text-2xl md:text-3xl leading-none mb-2">{s.num}</div>
                <div className="text-xs md:text-sm font-semibold text-white/80 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="section-wrap">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="kicker mb-4">Six Differentiators</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-navy mb-4">
              What makes us the trusted choice for 2000+ businesses
            </h2>
            <p className="text-brand-muted">
              We built SS Tax Mentors the way we'd want a compliance partner to work: transparent, human, accountable, and unwilling to cut corners on security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="card p-7 group hover:border-brand-blue/40 transition">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-amber/10 text-brand-amber">
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-brand-navy text-lg md:text-xl mb-3 leading-snug">{p.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-brand-bgSoft border-y border-brand-line">
        <div className="section-wrap">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="kicker mb-4">Our Process</p>
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-navy mb-5">
                Exactly how your registration travels from upload to GSTIN.
              </h2>
              <p className="text-brand-muted leading-relaxed mb-6">
                Most applicants never see what happens after they click Submit. We believe transparency builds trust — so here's the complete, 6‑step lifecycle of every application filed through SS Tax Mentors.
              </p>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-brand-line">
                <div className="w-10 h-10 rounded-full bg-green-50 text-brand-ok flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-sm">
                  <b className="text-brand-navy">Average 3‑day turnaround.</b> Median time from completed file to ARN is 24 hours; to GSTIN certificate is 3 days.
                </div>
              </div>
            </div>

            <ol className="relative space-y-5">
              {timeline.map((t, i) => (
                <li key={t.step} className="relative pl-16">
                  <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-brand-blue text-white font-heading font-black text-lg flex items-center justify-center shadow-sm">
                    {t.step}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="absolute left-6 top-12 w-[2px] h-[calc(100%+20px)] bg-gradient-to-b from-brand-blue/40 to-brand-line" />
                  )}
                  <div className="card p-5">
                    <div className="font-heading font-black text-brand-navy mb-1.5">{t.label}</div>
                    <p className="text-sm text-brand-muted leading-relaxed">{t.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="section-wrap">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="kicker mb-4">Side‑by‑Side</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-navy mb-4">
              Not all GST services are built the same.
            </h2>
            <p className="text-brand-muted">Here's what actually changes when you choose a practitioner‑led service over a bulk‑filing startup.</p>
          </div>

          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-2 bg-brand-navy text-white">
              <div className="px-6 py-4 text-sm font-bold opacity-70 uppercase tracking-wider">{differentiators[0].a}</div>
              <div className="px-6 py-4 text-sm font-bold text-brand-amber uppercase tracking-wider border-l border-white/10">
                <span className="inline-flex items-center gap-2"><Star className="w-4 h-4 fill-current" /> {differentiators[0].b}</span>
              </div>
            </div>
            {differentiators[0].data.map((row, i) => (
              <div key={i} className={`grid grid-cols-1 md:grid-cols-2 ${i % 2 ? 'bg-brand-bgSoft' : 'bg-white'}`}>
                <div className="px-6 py-3 text-sm text-brand-muted md:border-r border-brand-line before:content-['❌_'] md:before:content-none">{row[0]}</div>
                <div className="px-6 py-3 text-sm font-semibold text-brand-navy border-t md:border-t-0 border-brand-line">
                  <span className="inline-flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-ok shrink-0 mt-0.5" />
                    {row[1]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-brand-blue to-brand-navy text-white">
        <div className="section-wrap max-w-4xl text-center">
          <h2 className="font-heading font-black text-3xl md:text-4xl mb-4">
            Ready for a GST partner that picks up the phone?
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Start a registration in under 5 minutes, or schedule a 15‑minute call with a practitioner to get your specific questions answered — no jargon, no sales pitch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/gst-registration" className="inline-flex items-center gap-2 bg-white text-brand-navy hover:bg-white/90 rounded-xl px-7 py-3.5 font-bold transition">
              Start Registration <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="tel:+918179726723" className="inline-flex items-center gap-2 hover:text-brand-amber transition">
                <Phone className="w-4 h-4" /> +91 8179726723
              </a>
              <a href="mailto:someshtellakula@gmail.com" className="inline-flex items-center gap-2 hover:text-brand-amber transition">
                <Mail className="w-4 h-4" /> someshtellakula@gmail.com
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 hover:text-brand-amber transition">
                <Globe className="w-4 h-4" /> Contact Page
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
