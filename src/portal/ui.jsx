import { Loader2 } from 'lucide-react';

export function NovaMark({ className = 'w-8 h-8' }) {
  return (
    <span className={`${className} grid place-items-center rounded-lg bg-brand text-white shadow-sm`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </span>
  );
}

const BUTTON = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-hover',
  secondary: 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  link: 'text-brand hover:underline underline-offset-4 px-0 h-auto',
};
const SIZE = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${BUTTON[variant]} ${variant === 'link' ? '' : SIZE[size]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</section>;
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, badge }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 text-sm text-slate-500 max-w-[65ch]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-soft text-brand',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`w-8 h-8 grid place-items-center rounded-lg ${tones[tone]}`}>
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 text-[28px] leading-none font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-[13px] text-slate-500">{hint}</p>}
    </Card>
  );
}

export function Field({ label, htmlFor, hint, error, required, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] text-red-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass = (error) =>
  `block w-full h-10 px-3 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 border shadow-sm ${
    error ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-brand focus:ring-brand-ring/60'
  } focus:outline-none focus:ring-4 transition-shadow disabled:bg-slate-50 disabled:text-slate-500`;

export function Tabs({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex p-1 rounded-lg bg-slate-100">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`h-8 px-3 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {opt.label}
            {opt.count != null && <span className={`ml-1.5 tabular-nums ${active ? 'text-slate-500' : 'text-slate-400'}`}>{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="px-6 py-14 text-center">
      {Icon && (
        <span className="mx-auto mb-4 w-11 h-11 grid place-items-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-[15px] font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500 max-w-[46ch] mx-auto">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, className = '' }) {
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span className={`shrink-0 w-8 h-8 grid place-items-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
