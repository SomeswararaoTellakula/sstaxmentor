export function formatMobile(m) {
  if (!m) return '';
  const d = String(m).replace(/\D/g, '');
  const last10 = d.slice(-10);
  if (last10.length < 10) return m;
  return `+91 ${last10.slice(0, 5)}-${last10.slice(5)}`;
}

export function maskAadhaarDisplay(last4) {
  if (!last4) return 'XXXX XXXX XXXX';
  return `XXXX XXXX ${String(last4).slice(-4)}`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function fmtDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fileSize(size) {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

export const BUSINESS_TYPES = [
  'Proprietorship','Partnership','LLP','Private Limited','Public Limited','HUF','Trust/Society','Other',
];

export const STATUSES = [
  'Submitted','Under Review','Documents Pending','Filed','ARN Generated','Approved','Rejected',
];

export const STATUS_STYLE = {
  'Submitted':        'bg-blue-50 text-blue-700',
  'Under Review':     'bg-amber-50 text-amber-700',
  'Documents Pending':'bg-orange-50 text-orange-700',
  'Filed':            'bg-indigo-50 text-indigo-700',
  'ARN Generated':    'bg-purple-50 text-purple-700',
  'Approved':         'bg-green-50 text-green-700',
  'Rejected':         'bg-red-50 text-red-700',
};

export function statusBadgeClass(s) {
  return `status-badge ${STATUS_STYLE[s] || 'bg-gray-100 text-gray-700'}`;
}
