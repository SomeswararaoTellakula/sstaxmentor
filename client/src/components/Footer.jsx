import { Mail, Phone, Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-navy text-white">
      <div className="section-wrap py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-heading font-black text-xl">
              S<span className="text-brand-sky">T</span>M
            </div>
            <div>
              <div className="font-heading font-black text-white text-lg">SS TAX MENTORS</div>
              <div className="text-[10px] font-semibold text-brand-sky uppercase tracking-wider">Reach Us & Relax</div>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Professional tax, compliance and financial management solutions for businesses & entrepreneurs across India.
          </p>
        </div>
        <div>
          <h4 className="font-heading font-bold text-white mb-4">Services</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>GST Registration</li>
            <li>Income Tax Filing</li>
            <li>Tax Audit</li>
            <li>Company / LLP Incorporation</li>
            <li>Compliance Advisory</li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-bold text-white mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-2"><Phone className="w-4 h-4 text-brand-blueLt mt-0.5" /> +91 8179726723</li>
            <li className="flex items-start gap-2"><Mail className="w-4 h-4 text-brand-blueLt mt-0.5" /> someshtellakula@gmail.com</li>
            <li className="flex items-start gap-2"><Globe className="w-4 h-4 text-brand-blueLt mt-0.5" /> www.sstaxmentors.com</li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-bold text-white mb-4">Pan-India Service</h4>
          <p className="text-sm text-white/70 mb-4">
            Established in 2016 · 2000+ clients · 500+ GST registrations filed · 99% compliance accuracy.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold">2000+ Clients</span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold">500+ GSTs</span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold">Est. 2016</span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold">99% Accurate</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="section-wrap py-4 text-xs text-white/60 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} SS Tax Mentors. All rights reserved.</div>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
