import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, FileCheck, FileX, PackageOpen, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api.js';
import { fmtDate, fmtDateShort, formatMobile, statusBadgeClass, STATUSES } from '../lib/utils.js';

const STEPS = ['Submitted', 'Under Review', 'Filed', 'ARN Generated', 'Approved'];

export default function TrackApplication() {
  const { id: paramId } = useParams();
  const [inputId, setInputId] = useState(paramId || '');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const nav = useNavigate();

  async function search(applicationId) {
    if (!applicationId) return;
    setLoading(true); setNotFound(false); setRecord(null);
    try {
      const { data } = await api.get(`/api/gst/track/${applicationId.trim()}`);
      setRecord(data);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
      else alert(e?.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (paramId) { setInputId(paramId); search(paramId); }
  }, [paramId]);

  const currentIndex = record ? STEPS.indexOf(record.status) : -1;
  const approved = record?.status === 'Approved';
  const rejected = record?.status === 'Rejected';

  return (
    <div className="section-wrap py-14 md:py-20 max-w-4xl">
      <div className="text-center mb-10">
        <p className="kicker mb-4">Status Tracking</p>
        <h1 className="font-heading font-black text-3xl md:text-4xl mb-3">Track your GST Application</h1>
        <p className="text-brand-muted">Enter your Application ID to see the real-time status.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); nav(`/track/${inputId.trim()}`); search(inputId); }} className="card p-5 flex flex-col sm:flex-row gap-3 mb-10">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="e.g. SSTM-GST-2026-00001"
            className="pl-10"
          />
        </div>
        <button type="submit" disabled={loading || !inputId} className="btn-primary min-w-[140px]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {notFound && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <FileX className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-xl text-brand-navy mb-2">Application not found</h3>
          <p className="text-brand-muted">Please check the Application ID and try again, or contact us at +91 8179726723.</p>
        </div>
      )}

      {record && (
        <div className="space-y-6">
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Application ID</div>
                <div className="font-heading font-black text-2xl text-brand-navy">{record.applicationId}</div>
              </div>
              <span className={statusBadgeClass(record.status)}>
                {approved && <CheckCircle className="w-3.5 h-3.5" />}
                {rejected && <XCircle className="w-3.5 h-3.5" />}
                {!approved && !rejected && <Clock className="w-3.5 h-3.5" />}
                {record.status}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-brand-muted uppercase tracking-wider font-bold">Applicant</div>
                <div className="font-semibold text-brand-navy">{record.applicantName}</div>
              </div>
              <div>
                <div className="text-xs text-brand-muted uppercase tracking-wider font-bold">Firm</div>
                <div className="font-semibold text-brand-navy">{record.firmName}</div>
              </div>
              <div>
                <div className="text-xs text-brand-muted uppercase tracking-wider font-bold">Contact</div>
                <div className="font-semibold text-brand-navy">{formatMobile(record.mobile)}<br /><span className="font-normal text-brand-muted text-xs">{record.email}</span></div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-brand-line">
              <div><div className="text-xs text-brand-muted uppercase tracking-wider font-bold">Submitted</div><div className="font-semibold">{fmtDate(record.submittedAt)}</div></div>
              <div><div className="text-xs text-brand-muted uppercase tracking-wider font-bold">Last Update</div><div className="font-semibold">{fmtDate(record.updatedAt)}</div></div>
              <div>
                <div className="text-xs text-brand-muted uppercase tracking-wider font-bold">{record.arn ? 'ARN' : (record.gstin ? 'GSTIN' : 'Reference')}</div>
                <div className="font-semibold">{record.arn || record.gstin || '—'}</div>
              </div>
            </div>
          </div>

          <div className="card p-6 md:p-8">
            <h3 className="font-heading font-bold text-xl text-brand-navy mb-6">Progress timeline</h3>
            <ol className="relative border-s-2 border-brand-line ms-3">
              {STEPS.map((label, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                return (
                  <li key={label} className="ms-7 mb-6 last:mb-0">
                    <span className={`absolute -start-[11px] flex items-center justify-center w-6 h-6 rounded-full border-2 ${done ? 'bg-brand-ok border-brand-ok text-white' : 'bg-white border-brand-line text-brand-muted'}`}>
                      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                    </span>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-heading font-bold ${done || active ? 'text-brand-navy' : 'text-brand-muted'}`}>{label}</h4>
                      {active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue uppercase tracking-wider">Current</span>}
                    </div>
                    <p className="text-xs text-brand-muted mt-1">
                      {i === 0 && `Submitted on ${fmtDateShort(record.submittedAt)}`}
                      {i === 1 && (done ? 'Documents verified by our team.' : 'Documents queued for verification.')}
                      {i === 2 && (done ? 'Filed on the GST portal.' : 'Pending filing.')}
                      {i === 3 && (done ? `ARN: ${record.arn || 'Generated'}` : 'ARN will be issued after filing.')}
                      {i === 4 && (done ? `GSTIN: ${record.gstin || 'Approved'}` : 'Approval from GSTN pending.')}
                    </p>
                  </li>
                );
              })}
              {rejected && (
                <li className="ms-7">
                  <span className="absolute -start-[11px] flex items-center justify-center w-6 h-6 rounded-full border-2 bg-red-500 border-red-500 text-white">
                    <XCircle className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="font-heading font-bold text-red-700">Rejected</h4>
                  <p className="text-xs text-brand-muted mt-1">If you have questions, please contact +91 8179726723.</p>
                </li>
              )}
            </ol>
          </div>

          <div className="card p-6 md:p-8 bg-brand-bgSoft border-brand-blue/20">
            <h3 className="font-heading font-bold text-lg text-brand-navy mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-brand-blue" /> Notifications</h3>
            <p className="text-sm text-brand-text mb-3">You will receive status updates on your registered email and mobile via WhatsApp.</p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:someshtellakula@gmail.com" className="btn-secondary">Email Us</a>
              <a href="tel:+918179726723" className="btn-secondary">Call +91 8179726723</a>
              <a href={`https://wa.me/918179726723?text=${encodeURIComponent('Hi SS Tax Mentors! Following up on my GST application ' + record.applicationId)}`} target="_blank" rel="noreferrer" className="btn-primary">Chat on WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
