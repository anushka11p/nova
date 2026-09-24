import { AlertTriangle, BarChart3, CheckCircle2, CircleHelp, Plus, ScanLine } from 'lucide-react';
import { ChartLegend, DailyScreeningsChart, LikelihoodHistogram } from '../charts';
import { Button, Card, CardHeader, EmptyState, PageHeader, StatCard } from '../ui';
import { RISKS, pct, riskOf, thresholdOf } from '../clinical';

export function Analytics({ records, metrics, onNew }) {
  const threshold = thresholdOf(null, metrics);
  const totals = { High: 0, Moderate: 0, Normal: 0 };
  records.forEach((r) => { totals[riskOf(r).key] += 1; });
  const share = (k) => (records.length ? pct(totals[k] / records.length, 1) : '—');

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Built from every screening saved in this installation, including practice screenings." />

      {records.length === 0 ? (
        <Card>
          <EmptyState icon={BarChart3} title="Nothing to chart yet" action={<Button icon={Plus} onClick={onNew}>New screening</Button>}>
            Charts fill in as screenings are saved.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total screenings" value={records.length} icon={ScanLine} tone="brand" />
            <StatCard label="High risk" value={totals.High} hint={`${share('High')} of all screenings`} icon={AlertTriangle} tone="red" />
            <StatCard label="Borderline" value={totals.Moderate} hint={`${share('Moderate')} of all screenings`} icon={CircleHelp} tone="amber" />
            <StatCard label="Normal" value={totals.Normal} hint={`${share('Normal')} of all screenings`} icon={CheckCircle2} tone="emerald" />
          </div>

          <Card>
            <CardHeader title="Screenings per day" description="Last 30 days, by result" action={<ChartLegend />} />
            <div className="px-5 pb-5"><DailyScreeningsChart records={records} days={30} height={240} /></div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Spread of jaundice likelihood" description="How many screenings fall in each 5% band" />
              <div className="px-5 pb-5">
                <LikelihoodHistogram records={records} threshold={threshold} />
                <p className="mt-4 text-[13px] text-slate-500 max-w-[65ch]">
                  A cluster just under the cut-off suggests photos worth retaking. True jaundice cases tend to sit well above it.
                </p>
              </div>
            </Card>
            <Card>
              <CardHeader title="Result mix" description="All time" />
              <div className="px-5 pb-5 space-y-4">
                {['High', 'Moderate', 'Normal'].map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{RISKS[k].word}</span>
                      <span className="font-medium text-slate-900 tabular-nums">{totals[k]} <span className="text-slate-400 font-normal">· {share(k)}</span></span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${RISKS[k].solid}`} style={{ width: `${(totals[k] / records.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
