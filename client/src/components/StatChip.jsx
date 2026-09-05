import { Check } from 'lucide-react';

export default function StatChip({ children, icon = Check, className = '' }) {
  const Icon = icon;
  return (
    <span className={`chip ${className}`}>
      <Icon className="w-3.5 h-3.5 text-brand-ok" />
      {children}
    </span>
  );
}
