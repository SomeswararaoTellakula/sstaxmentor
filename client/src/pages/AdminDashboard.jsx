import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, Filter, Download, LogOut,
  RefreshCw, Eye, Mail, MessageCircle, Database, Trash2,
  Loader2, X, CheckCircle2, XCircle, AlertTriangle, FileText,
} from 'lucide-react';
import api from '../lib/api.js';
import { STATUSES, fmtDate, formatMobile, statusBadgeClass, fileSize } from '../lib/utils.js';

export default function AdminDashboard() {
  const { id: routeId } = useParams();
  const nav = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [detailId, setDetailId] = useState(routeId || null);
  const [detail, setDetail] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  async function loadMe() {
    try { const { data } = await api.get('/api/admin/me'); setAdmin(data.admin); }
    catch { nav('/admin/login'); }
  }
  async function loadStats() { try { const { data } = await api.get('/api/admin/stats'); setStats(data); } catch {} }
  async function loadList() {
    setIsLoadingList(true);
    try {
      const { data } = await api.get('/api/admin/registrations', {
        params: { page, perPage, q: q || undefined, status: status || undefined, from: from || undefined, to: to || undefined },
      });
      setItems(data.items); setCount(data.count);
    } finally { setIsLoadingList(false); }
  }
  async function loadDetail(id) {
    setIsLoadingDetail(true); setDetail(null);
    try { const { data } = await api.get(`/api/admin/registrations/${id}`); setDetail(data); }
    catch (e) { alert(e?.response?.data?.error || e.message); setDetailId(null); nav('/admin'); }
    finally { setIsLoadingDetail(false); }
  }

  useEffect(() => { loadMe(); }, []);
  useEffect(() => { loadStats(); loadList(); }, [page, status, from, to]);

  useEffect(() => {
    const t = setTimeout(() => loadList(), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (detailId) loadDetail(detailId);
    else setDetail(null);
  }, [detailId]);

  useEffect(() => { if (routeId) setDetailId(routeId); }, [routeId]);

  const totalPages = Math.max(1, Math.ceil(count / perPage));

  async function logout() {
    try { await api.post('/api/admin/logout'); } finally { nav('/admin/login'); }
  }

  async function saveDetail(patch) {
    if (!detail) return;
    setSaving(true);
    try {
      await api.patch(`/api/admin/registrations/${detail.applicationId}`, patch);
      await loadDetail(detail.applicationId);
      await loadList();
      await loadStats();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally { setSaving(false); }
  }

  async function resend(channel) {
    if (!detail) return;
    try {
      const { data } = await api.post(`/api/admin/registrations/${detail.applicationId}/resend`, { channel });
      alert(`${channel}: ${data.ok ? 'Retried successfully' : 'Failed — ' + (data.result?.error || 'unknown')}`);
      await loadDetail(detail.applicationId);
    } catch (e) { alert(e?.response?.data?.error || e.message); }
  }

  async function removeRecord() {
    if (!detail) return;
    if (!confirm(`Permanently delete ${detail.applicationId} and purge uploaded files? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/registrations/${detail.applicationId}`);
      setDetailId(null); nav('/admin');
      await loadList(); await loadStats();
    } catch (e) { alert(e?.response?.data?.error || e.message); }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    window.location.href = `/api/admin/registrations/export${params.toString() ? '?' + params.toString() : ''}`;
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-brand-bgSoft">
      <div className="bg-white border-b border-brand-line sticky top-0 z-30">
        <div className="section-wrap flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blueLt text-white font-heading font-black text-sm flex items-center justify-center">STM</div>
            <div>
              <div className="font-heading font-black text-brand-navy text-sm leading-none">Admin Dashboard</div>
              <div className="text-[11px] text-brand-muted">{admin.email}</div>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="section-wrap py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total applications', value: stats.total, accent: 'from-brand-blue to-brand-blueLt' },
              { label: 'This month', value: stats.thisMonth, accent: 'from-brand-ok to-green-400' },
              { label: 'Under review', value: stats.byStatus['Under Review'] || 0, accent: 'from-brand-amber to-orange-400' },
              { label: 'Approved', value: stats.byStatus['Approved'] || 0, accent: 'from-emerald-500 to-teal-400' },
            ].map((s) => (
              <div key={s.label} className="card p-5 relative overflow-hidden">
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${s.accent} opacity-20`} />
                <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">{s.label}</div>
                <div className="mt-1 font-heading font-black text-3xl text-brand-navy">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card p-4 md:p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5 block">Search (Name / Firm / Mobile / App ID)</label>
              <div className="relative">
                <Search className="w-4 h-4 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5 block">From</label>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5 block">To</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
            </div>
            <div className="flex gap-2">
              <button onClick={loadList} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Refresh</button>
              <button onClick={exportCsv} className="btn-primary"><Download className="w-4 h-4" /> CSV</button>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-bgSoft text-left text-[11px] uppercase tracking-wider text-brand-muted">
                <tr>
                  <th className="px-4 py-3">Application ID</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Firm</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoadingList && items.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-12 text-center text-brand-muted">Loading…</td></tr>
                )}
                {!isLoadingList && items.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-12 text-center text-brand-muted">No applications match your filters.</td></tr>
                )}
                {items.map((r) => (
                  <tr key={r._id} className="border-t border-brand-line hover:bg-brand-bgSoft/60">
                    <td className="px-4 py-3 font-heading font-bold text-brand-blue">{r.applicationId}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-brand-navy">{r.applicantName}</td>
                    <td className="px-4 py-3 text-brand-text">{r.firmName}</td>
                    <td className="px-4 py-3 text-brand-text text-xs">{formatMobile(r.mobile)}</td>
                    <td className="px-4 py-3"><span className={statusBadgeClass(r.status)}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setDetailId(r.applicationId); nav(`/admin/${r.applicationId}`); }} className="btn-ghost p-2">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-brand-line flex items-center justify-between text-sm">
            <div className="text-brand-muted text-xs">
              Showing {Math.min((page - 1) * perPage + 1, count)} – {Math.min(page * perPage, count)} of {count}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-ghost p-2 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {detailId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-full max-w-3xl h-full bg-white shadow-xl overflow-y-auto flex flex-col">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-brand-line flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Application detail</div>
                <div className="font-heading font-black text-xl text-brand-navy">{detail?.applicationId || 'Loading…'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={removeRecord} className="btn-danger p-2" title="Delete record & purge files"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => { setDetailId(null); nav('/admin'); }} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {isLoadingDetail && !detail && (
              <div className="flex-1 flex items-center justify-center text-brand-muted"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
            )}

            {detail && (
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={statusBadgeClass(detail.status)}>{detail.status}</span>
                  <span className="chip"><Database className="w-3.5 h-3.5 text-brand-muted" /> {fmtDate(detail.createdAt)}</span>
                  {detail.meta?.ip && <span className="chip">IP: {detail.meta.ip}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Applicant', detail.applicantName],
                    ['Mobile', formatMobile(detail.mobile)],
                    ['Alt Mobile', detail.altMobile ? formatMobile(detail.altMobile) : '—'],
                    ['Email', detail.email],
                    ['Firm Name', detail.firmName],
                    ['Business Type', detail.businessType],
                    ['Nature', detail.businessNature || '—'],
                    ['City', detail.city],
                    ['State', detail.state],
                    ['PIN', detail.pincode],
                    ['Premises', detail.premisesType],
                    ['PAN', detail.panNumber],
                    ['Aadhaar (masked)', detail.aadhaarMasked],
                    ['Aadhaar (full, encrypted at rest)', detail.aadhaarFull ? detail.aadhaarFull.replace(/(\d{4})(?=\d)/g, '$1 ') : '—'],
                    ['Owner Name', detail.ownerName || '—'],
                    ['Owner Mobile', detail.ownerMobile ? formatMobile(detail.ownerMobile) : '—'],
                    ['Witness Name', detail.witnessName || '—'],
                    ['Witness Mobile', detail.witnessMobile ? formatMobile(detail.witnessMobile) : '—'],
                    ['Remarks', detail.remarks || '—'],
                    ['Consent At', detail.consentAt ? fmtDate(detail.consentAt) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 border-b border-brand-line/50 py-2 last:border-0">
                      <div className="w-40 text-xs uppercase tracking-wider font-bold text-brand-muted shrink-0">{k}</div>
                      <div className="font-medium text-brand-text break-all">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="card p-5">
                  <h3 className="font-heading font-bold text-lg text-brand-navy mb-3">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(detail.documents || {}).map(([key, ref]) => {
                      if (!ref) return null;
                      const isImg = /^image\//.test(ref.mimeType || '');
                      return (
                        <a
                          key={key}
                          href={ref.signedUrl || ref.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => { if (isImg && ref.signedUrl) { e.preventDefault(); setLightbox(ref.signedUrl); } }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-brand-line hover:border-brand-blue/50 hover:bg-brand-bgSoft transition"
                        >
                          {isImg ? (
                            <img src={ref.signedUrl || ref.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-brand-line" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-brand-bgSoft flex items-center justify-center text-brand-blue"><FileText className="w-5 h-5" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">{key}</div>
                            <div className="font-semibold text-brand-navy text-sm truncate">{ref.originalName}</div>
                            <div className="text-[11px] text-brand-muted">{fileSize(ref.sizeBytes)} · {ref.mimeType}</div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  {detail.delivery?.pdfUrl && (
                    <a href={detail.delivery.pdfSignedUrl || detail.delivery.pdfUrl} target="_blank" rel="noreferrer" className="mt-5 btn-primary w-full justify-center">
                      <FileText className="w-4 h-4" /> Download Acknowledgement PDF
                    </a>
                  )}
                </div>

                <div className="card p-5">
                  <h3 className="font-heading font-bold text-lg text-brand-navy mb-4">Update status & details</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label>Status</label>
                      <select value={detail.status} onChange={(e) => saveDetail({ status: e.target.value })} disabled={saving}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>ARN</label>
                      <input defaultValue={detail.arn || ''} onBlur={(e) => saveDetail({ arn: e.target.value })} disabled={saving} placeholder="AA2607XXXXXXX" />
                    </div>
                    <div className="md:col-span-2">
                      <label>GSTIN</label>
                      <input defaultValue={detail.gstin || ''} onBlur={(e) => saveDetail({ gstin: e.target.value })} disabled={saving} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div className="md:col-span-2">
                      <label>Internal notes</label>
                      <textarea rows="3" defaultValue={detail.internalNotes || ''} onBlur={(e) => saveDetail({ internalNotes: e.target.value })} disabled={saving} />
                    </div>
                  </div>
                  {saving && <div className="text-xs text-brand-amber flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</div>}
                </div>

                <div className="card p-5">
                  <h3 className="font-heading font-bold text-lg text-brand-navy mb-4">Delivery & Retries</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'sheetSynced', label: 'Google Sheets Sync', Icon: Database },
                      { key: 'emailSent', label: 'Applicant Email', Icon: Mail },
                      { key: 'whatsappSent', label: 'Applicant WhatsApp', Icon: MessageCircle },
                    ].map(({ key, label, Icon }) => {
                      const d = detail.delivery?.[key] || {};
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-brand-line">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d.ok ? 'bg-green-50 text-brand-ok' : 'bg-amber-50 text-amber-600'}`}>
                              {d.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-brand-navy">{label}</div>
                              <div className="text-[11px] text-brand-muted">
                                {d.ok ? `Sent at ${fmtDate(d.at)} · ${d.attempts || 1} attempts` : (d.error ? `Error: ${d.error.slice(0, 90)} · ` : 'Not sent · ') + `${d.attempts || 0}/3 attempts`}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => resend(key === 'sheetSynced' ? 'sheet' : key === 'emailSent' ? 'email' : 'whatsapp')} className="btn-secondary text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Retry
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white/80 hover:text-white btn-ghost p-2" onClick={() => setLightbox(null)}><X className="w-6 h-6" /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
