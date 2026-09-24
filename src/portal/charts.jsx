import { useMemo } from 'react';
import { localDayKey, pct, probabilityOf, recordDay, riskOf } from './clinical';

const SERIES = [
  { key: 'Normal', label: 'Normal', color: 'bg-emerald-500' },
  { key: 'Moderate', label: 'Borderline', color: 'bg-amber-400' },
  { key: 'High', label: 'High risk', color: 'bg-red-500' },
];

export function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-[13px] text-slate-500">
      {[...SERIES].reverse().map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

/** Stacked daily bars by result, with gridlines and a count axis. */
export function DailyScreeningsChart({ records, days = 14, height = 200 }) {
  const data = useMemo(() => {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push({ key: localDayKey(d), day: d, High: 0, Moderate: 0, Normal: 0 });
    }
    const byKey = Object.fromEntries(out.map((d) => [d.key, d]));
    records.forEach((r) => {
      const k = recordDay(r);
      if (byKey[k]) byKey[k][riskOf(r).key] += 1;
    });
    return out;
  }, [records, days]);

  const peak = Math.max(...data.map((d) => d.High + d.Moderate + d.Normal));
  const step = peak <= 4 ? 1 : Math.ceil(peak / 4);
  const top = Math.max(4, Math.ceil(peak / step) * step);
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step).reverse();

  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between text-[11px] text-slate-400 tabular-nums text-right w-5 pb-6" style={{ height }}>
        {ticks.map((t) => <span key={t} className="leading-none">{t}</span>)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="relative" style={{ height: height - 24 }}>
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-dashed border-slate-100" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2" role="img" aria-label={`Screenings per day over the last ${days} days`}>
            {data.map((d) => {
              const total = d.High + d.Moderate + d.Normal;
              return (
                <div key={d.key} className="group relative flex-1 h-full flex flex-col justify-end">
                  <div className="w-full rounded-t-[4px] overflow-hidden flex flex-col-reverse" style={{ height: `${(total / top) * 100}%` }}>
                    {SERIES.map((s) => (d[s.key] ? <div key={s.key} className={s.color} style={{ height: `${(d[s.key] / total) * 100}%` }} /> : null))}
                  </div>
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                    <p className="font-semibold">{d.day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    <p>{total} screenings · {d.High} high · {d.Moderate} borderline</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 mt-2 h-4">
          {data.map((d, i) => (
            <span key={d.key} className="flex-1 text-center text-[11px] text-slate-400 whitespace-nowrap">
              {i % 3 === (days - 1) % 3 ? d.day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Histogram of jaundice likelihood with the cut-off marked. */
export function LikelihoodHistogram({ records, threshold, height = 180 }) {
  const BINS = 20;
  const bins = Array.from({ length: BINS }, () => 0);
  const probs = records.map(probabilityOf).filter((p) => p != null);
  probs.forEach((p) => { bins[Math.min(BINS - 1, Math.floor(p * BINS))] += 1; });
  const max = Math.max(1, ...bins);
  if (probs.length === 0) return <p className="py-8 text-sm text-slate-500">No screenings with a stored likelihood yet.</p>;
  return (
    <div>
      <div className="relative h-5 text-[11px] font-medium text-slate-700">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${threshold * 100}%` }}>Cut-off {pct(threshold)}</span>
      </div>
      <div className="relative flex items-end gap-1 border-b border-slate-200" style={{ height }} role="img" aria-label="Distribution of jaundice likelihood">
        {bins.map((n, i) => {
          const mid = (i + 0.5) / BINS;
          const color = mid >= threshold ? 'bg-red-500' : mid >= threshold / 2 ? 'bg-amber-400' : 'bg-emerald-500';
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-[3px] ${color}`}
              style={{ height: `${(n / max) * 100}%`, minHeight: n ? 3 : 0 }}
              title={`${i * 5}–${i * 5 + 5}%: ${n} screening${n === 1 ? '' : 's'}`}
            />
          );
        })}
        <div className="absolute -top-1 bottom-0 border-l-2 border-dashed border-slate-900/60" style={{ left: `${threshold * 100}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[11px] text-slate-400 tabular-nums">
        <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
      </div>
    </div>
  );
}
