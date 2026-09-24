import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react';
import { pct, probabilityOf, riskOf } from './clinical';

export const RISK_ICON = { High: AlertTriangle, Moderate: CircleHelp, Normal: CheckCircle2 };

/** Soft status badge: icon plus word, never colour alone. */
export function RiskBadge({ record, risk: riskProp, size = 'md' }) {
  const risk = riskProp || riskOf(record);
  const Icon = RISK_ICON[risk.key];
  const sizes = size === 'lg' ? 'h-7 px-2.5 text-[13px] gap-1.5' : 'h-6 px-2 text-xs gap-1';
  return (
    <span className={`inline-flex items-center rounded-md font-medium ring-1 ring-inset whitespace-nowrap ${sizes} ${risk.badge}`}>
      <Icon className={size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} strokeWidth={2.5} aria-hidden="true" />
      {risk.word}
    </span>
  );
}

/** Horizontal likelihood bar with the normal / borderline / high zones and the cut-off marked. */
export function LikelihoodBar({ probability, threshold, showScale = true, compact = false }) {
  const mid = threshold / 2;
  return (
    <div>
      <div className={`relative ${compact ? 'h-1.5' : 'h-2'} rounded-full bg-slate-100 overflow-hidden`}>
        <div className="absolute inset-y-0 left-0 bg-emerald-100" style={{ width: `${mid * 100}%` }} />
        <div className="absolute inset-y-0 bg-amber-100" style={{ left: `${mid * 100}%`, width: `${(threshold - mid) * 100}%` }} />
        <div className="absolute inset-y-0 right-0 bg-red-100" style={{ left: `${threshold * 100}%` }} />
        {probability != null && (
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${probability >= threshold ? 'bg-red-600' : probability >= mid ? 'bg-amber-500' : 'bg-emerald-600'}`}
            style={{ width: `${Math.max(probability, 0.01) * 100}%` }}
          />
        )}
        <div className="absolute inset-y-0 w-0.5 bg-slate-900/70" style={{ left: `${threshold * 100}%` }} />
      </div>
      {showScale && (
        <div className="relative mt-1.5 h-4 text-[11px] text-slate-500 tabular-nums">
          <span className="absolute left-0">0%</span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap font-medium text-slate-700" style={{ left: `${threshold * 100}%` }}>
            Cut-off {pct(threshold)}
          </span>
          <span className="absolute right-0">100%</span>
        </div>
      )}
    </div>
  );
}

/** The result panel: status, likelihood against the cut-off, and how far to trust it. */
export function ResultSummary({ record, threshold, metrics }) {
  const risk = riskOf(record);
  const p = probabilityOf(record);
  const Icon = RISK_ICON[risk.key];
  return (
    <div className="result-in">
      <div className={`flex items-start gap-3 rounded-lg border p-4 ${risk.soft}`}>
        <span className={`shrink-0 w-9 h-9 grid place-items-center rounded-full text-white ${risk.solid}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={`text-[15px] font-semibold ${risk.text}`}>{risk.word}</p>
          <p className="text-sm text-slate-700">{risk.headline}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-medium text-slate-500">Jaundice likelihood</p>
          <p className="text-[28px] leading-none font-semibold tracking-tight text-slate-900 tabular-nums">{pct(p, 1)}</p>
        </div>
        <div className="mt-3">
          {p != null ? (
            <LikelihoodBar probability={p} threshold={threshold} />
          ) : (
            <p className="text-[13px] text-slate-500">Likelihood was not stored for this earlier record.</p>
          )}
        </div>
      </div>

      {metrics?.test && (
        <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
          On {metrics.test.n} unseen test photos, the model caught {pct(metrics.test.sensitivity, 1)} of jaundice cases and cleared{' '}
          {pct(metrics.test.specificity, 1)} of normal babies. A bilirubin measurement decides.
        </p>
      )}
    </div>
  );
}
