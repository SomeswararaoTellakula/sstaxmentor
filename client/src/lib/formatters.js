export function formatPan(v) {
  if (!v) return '';
  return String(v).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
}

export function formatAadhaarInput(v) {
  if (!v) return '';
  const d = String(v).replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < d.length; i += 4) parts.push(d.slice(i, i + 4));
  return parts.join(' ');
}

export function formatMobileInput(v) {
  if (!v) return '';
  const d = String(v).replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatPincode(v) {
  if (!v) return '';
  return String(v).replace(/\D/g, '').slice(0, 6);
}

const D_MULTIPLIER = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];
const D_PERM = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];
export function validateAadhaar(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length !== 12) return false;
  if (!/^[2-9]/.test(d)) return false;
  let c = 0;
  const inv = d.split('').map(Number).reverse();
  for (let i = 0; i < inv.length; i++) c = D_MULTIPLIER[c][D_PERM[i % 8][inv[i]]];
  return c === 0;
}
export function validatePAN(v) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(v || '').toUpperCase());
}
export function validateMobile(v) {
  return /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, ''));
}
export function validatePincode(v) {
  return /^\d{6}$/.test(String(v || '').replace(/\D/g, ''));
}
