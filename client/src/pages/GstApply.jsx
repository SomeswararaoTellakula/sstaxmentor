import { useEffect, useState } from 'react';
import { CheckCircle2, Download, ShieldCheck, Mail, MessageCircle, Database, Copy, Check } from 'lucide-react';
import GstForm from '../components/GstForm.jsx';
import api from '../lib/api.js';
import { Link } from 'react-router-dom';

export default function GstApply() {
  const [submitted, setSubmitted] = useState(null);
  const [copied, setCopied] = useState(false);

  async function autoDownloadPdf(applicationId, fallbackUrl) {
    try {
      const { data } = await api.get(`/api/gst/${applicationId}/pdf`, { responseType: 'blob', timeout: 60_000 });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${applicationId}-acknowledgement.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.warn('Auto PDF download failed', e);
      if (fallbackUrl) window.location.href = fallbackUrl;
    }
  }

  useEffect(() => {
    if (submitted?.applicationId) {
      setTimeout(() => autoDownloadPdf(submitted.applicationId, submitted.pdfUrl), 600);
    }
  }, [submitted?.applicationId]);

  function copyId() {
    if (!submitted?.applicationId) return;
    navigator.clipboard.writeText(submitted.applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (submitted) {
    const { applicationId, delivery } = submitted;
    return (
      <section id="gst-success" className="py-16 md:py-24 bg-brand-bgSoft">
        <div className="section-wrap max-w-3xl">
          <div className="card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-brand-blue via-brand-blueLt to-brand-blue" />
            <div className="w-20 h-20 rounded-full bg-green-50 text-brand-ok flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-navy mb-3">Application submitted!</h1>
            <p className="text-brand-muted mb-8">Thank you. Our team will verify your documents within 1 working day.</p>

            <div className="inline-flex items-center gap-3 bg-brand-bgSoft border border-brand-line px-5 py-4 rounded-2xl mb-8">
              <div className="text-left">
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Your Application ID</div>
                <div className="font-heading font-black text-xl md:text-2xl text-brand-blue">{applicationId}</div>
              </div>
              <button onClick={copyId} className="btn-ghost p-2">
                {copied ? <Check className="w-5 h-5 text-brand-ok" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="card p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${delivery?.sheetSynced?.ok ? 'bg-green-50 text-brand-ok' : 'bg-amber-50 text-amber-600'}`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">Saved</div>
                  <div className="text-sm font-semibold text-brand-navy">{delivery?.sheetSynced?.ok ? 'Synced to Sheets' : 'Queued'}</div>
                </div>
              </div>
              <div className="card p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${delivery?.emailSent?.ok ? 'bg-green-50 text-brand-ok' : 'bg-amber-50 text-amber-600'}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">Email</div>
                  <div className="text-sm font-semibold text-brand-navy">{delivery?.emailSent?.ok ? 'Sent ✓' : 'Retryable'}</div>
                </div>
              </div>
              <div className="card p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${delivery?.whatsappSent?.ok ? 'bg-green-50 text-brand-ok' : 'bg-amber-50 text-amber-600'}`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">WhatsApp</div>
                  <div className="text-sm font-semibold text-brand-navy">{delivery?.whatsappSent?.ok ? 'Sent ✓' : 'Retryable'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => autoDownloadPdf(applicationId, null)} className="btn-primary">
                <Download className="w-4 h-4" /> Download Acknowledgement (PDF)
              </button>
              <Link to={`/track/${applicationId}`} className="btn-secondary">
                <ShieldCheck className="w-4 h-4" /> Track application
              </Link>
              <Link to="/gst-registration/apply" onClick={(e) => { e.preventDefault(); setSubmitted(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-ghost">
                Submit another
              </Link>
            </div>

            <div className="mt-10 text-left p-5 rounded-2xl border border-brand-line bg-brand-bgSoft">
              <h3 className="font-heading font-bold text-brand-navy mb-2">What happens next?</h3>
              <ol className="space-y-2 text-sm text-brand-text list-decimal list-inside">
                <li>Our team verifies documents within 1 working day.</li>
                <li>Application is filed on the GST Portal.</li>
                <li>ARN is shared over email &amp; WhatsApp.</li>
                <li>GSTIN delivered on approval from GSTN.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gst-apply" className="py-14 md:py-20 scroll-mt-24">
      <div className="section-wrap max-w-5xl">
        <GstForm onSuccess={setSubmitted} />
      </div>
    </section>
  );
}
