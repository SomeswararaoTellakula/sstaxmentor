import { Link } from 'react-router-dom';
import { Calendar, Award, UserCog, FileCheck, ShieldCheck, Globe } from 'lucide-react';
import StatChip from '../components/StatChip.jsx';

const mandatoryItems = [
  'Aadhaar Card', 'PAN Card', 'Photo', 'Firm Name', 'Firm Full Address',
  'Latest Electricity Bill (Office or Business Premises)',
];
const contactItems = [
  { name: 'Mobile Number', mandatory: true },
  { name: 'Mail ID', mandatory: true },
  { name: 'Rental Agreement', optional: true },
  { name: 'Owner – Aadhaar Card & Mobile Number', optional: true },
  { name: 'Witness – Aadhaar Card & Mobile Number', optional: true },
  { name: 'Latest property tax receipt – Business Premises/Office', optional: true },
];

export default function GstRegistration() {
  return (
    <>
      <section className="relative bg-gradient-to-b from-white via-white to-brand-bgSoft">
        <div className="section-wrap pt-10 pb-16">
          <div className="relative rounded-3xl border border-brand-line bg-white shadow-sm overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 0%, #1A4FD6, transparent 30%), radial-gradient(circle at 80% 100%, #1A4FD6, transparent 30%)' }}/>
            <div className="relative grid lg:grid-cols-12 gap-0 p-8 md:p-12">
              <div className="lg:col-span-9">
                <div className="flex items-center justify-start mb-6">
                  <span className="kicker">IMPORTANT COMPLIANCE REQUIREMENT</span>
                </div>

                <h1 className="font-heading font-black text-brand-navy tracking-tight leading-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8">
                  GST <span className="block mt-1 md:inline md:ml-6">REGISTRATION</span>
                </h1>

                <div className="inline-flex items-center gap-4 px-6 py-5 rounded-2xl border-2 border-brand-amber/50 bg-brand-amber/10 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Calendar className="w-6 h-6 text-brand-amber" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-brand-amber/80">Turnaround</div>
                    <div className="font-heading font-black text-brand-amber text-2xl md:text-3xl">APPLY IN 3 WORKING DAYS</div>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="text-2xl md:text-3xl font-bold uppercase text-brand-navy tracking-tight mb-1">GET YOUR</div>
                  <div className="text-4xl md:text-6xl font-black font-heading tracking-tight">
                    <span className="text-brand-amber">GST NUMBER</span>{' '}
                    <span className="text-brand-navy">DONE ON TIME</span>
                  </div>
                  <div className="mt-4 inline-block px-5 py-2 rounded-full bg-brand-navy text-white font-bold text-lg tracking-wider">
                    FY 2025–26
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  {[
                    { Icon: UserCog, a: 'HANDLED BY', b: 'EXPERIENCED PROFESSIONALS' },
                    { Icon: FileCheck, a: 'ARN & GSTIN', b: 'TRACKED UNTIL APPROVAL' },
                    { Icon: ShieldCheck, a: 'DOCUMENTS', b: 'VERIFIED BEFORE FILING' },
                  ].map(({ Icon, a, b }, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full border-2 border-brand-blue/20 bg-brand-bgSoft flex items-center justify-center mb-4">
                        <div className="w-14 h-14 rounded-full border-2 border-brand-blue flex items-center justify-center text-brand-blue">
                          <Icon className="w-7 h-7" />
                        </div>
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.22em] text-brand-muted mb-1">{a}</div>
                      <div className="font-heading font-black text-brand-navy text-sm md:text-base leading-snug">{b}</div>
                      <div className="mt-4 w-14 h-0.5 bg-brand-amber/60 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 lg:border-l lg:border-dashed lg:border-brand-line lg:pl-8 mt-10 lg:mt-0">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-2 text-brand-amber">
                    <span className="text-lg">★</span><span className="text-lg">★</span><span className="text-lg">★</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-brand-muted mb-2">TRUSTED BY</div>
                  <div className="font-heading font-black text-brand-amber text-6xl leading-none">2000+</div>
                  <div className="font-heading font-black text-brand-navy tracking-wide mt-2 text-xl">CLIENTS</div>
                  <div className="flex items-center gap-1.5 mt-3 text-brand-amber">
                    <span className="text-lg">★</span><span className="text-lg">★</span><span className="text-lg">★</span>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="font-heading font-black text-brand-navy text-2xl leading-none">100+</div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-muted mt-1">GSTs Filed</div>
                  </div>
                  <div className="mt-8 space-y-3 w-full">
                    <StatChip><Award className="w-3.5 h-3.5" /> 2000+ Clients</StatChip>
                    <StatChip>100+ GST Registrations</StatChip>
                    <StatChip>Pan-India Service</StatChip>
                    <StatChip>99% Accuracy</StatChip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-brand-bgSoft border-y border-brand-line">
        <div className="section-wrap">
          <div className="text-center mb-12">
            <p className="kicker mb-4">Documents required</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl">Keep these ready before you begin</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="card p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-black text-xl text-brand-navy">Mandatory</h3>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-ok/10 text-brand-ok">Required</span>
              </div>
              <ul className="space-y-3">
                {mandatoryItems.map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-brand-ok/10 text-brand-ok flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <span className="text-brand-text text-base">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-black text-xl text-brand-navy">Contact &amp; Optional</h3>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-amber/10 text-brand-amber">Flexible</span>
              </div>
              <ul className="space-y-3">
                {contactItems.map((x) => (
                  <li key={x.name} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-brand-ok/10 text-brand-ok flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-brand-text text-base">{x.name}</span>
                      {x.mandatory && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Mandatory</span>}
                      {x.optional && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-line text-brand-muted">Optional</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/gst-registration/apply" className="btn-primary text-base px-7 py-3">
              I have my documents ready — Start Registration
            </Link>
          </div>
        </div>
      </section>

      <Link
        to="/gst-registration/apply"
        className="relative block bg-brand-blue hover:bg-brand-blue/90 text-white transition group"
      >
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold">START YOUR REGISTRATION AT</div>
              <div className="font-heading font-black text-lg md:text-xl">www.sstaxmentors.com/gst-registration/apply</div>
            </div>
          </div>
          <ChevronRightScaled />
        </div>
      </Link>
    </>
  );
}

function ChevronRightScaled() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
