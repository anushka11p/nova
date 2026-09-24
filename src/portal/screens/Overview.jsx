import { Activity, AlertTriangle, ArrowRight, CircleHelp, Gauge, Plus, ScanLine } from 'lucide-react';
import { RiskBadge } from '../Result';
import { ChartLegend, DailyScreeningsChart } from '../charts';
import { Avatar, Button, Card, CardHeader, EmptyState, PageHeader, StatCard } from '../ui';
import { formatAge, localDayKey, pct, probabilityOf, recordDay, riskOf, screenedAt } from '../clinical';

export function Overview({ records, metrics, health, userName, onNew, onOpen, onRecords, onModel }) {
  const todayKey = localDayKey(new Date());
  const today = records.filter((r) => recordDay(r) === todayKey);
  const count = (list, k) => list.filter((r) => riskOf(r).key === k).length;
  const followUp = records.filter((r) => riskOf(r).key !== 'Normal' && new Date(r.createdAt || r.date).getTime() >= Date.now() - 48 * 3600e3);
  const firstName = userName?.replace(/^Dr\.?\s+/, '').split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${firstName}` : 'Overview'}
        description={`${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Here is today's screening activity.`}
      />

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Screenings today" value={today.length} hint={`${records.length} in total`} icon={ScanLine} tone="brand" />
        <StatCard label="High risk today" value={count(today, 'High')} hint="Need a bilirubin check" icon={AlertTriangle} tone="red" />
        <StatCard label="Borderline today" value={count(today, 'Moderate')} hint="Retake photo or check" icon={CircleHelp} tone="amber" />
        <StatCard
          label="Model sensitivity"
          value={metrics?.test ? pct(metrics.test.sensitivity, 1) : '—'}
          hint={metrics?.test ? `On ${metrics.test.n} unseen test photos` : 'Metrics unavailable'}
          icon={Gauge}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Screenings" description="Last 14 days, by result" action={<ChartLegend />} />
          <div className="px-5 pb-5">
            <DailyScreeningsChart records={records} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Needs follow-up"
            description="High risk and borderline, last 48 hours"
            action={followUp.length > 0 && <span className="inline-flex h-6 min-w-6 px-2 items-center justify-center rounded-full bg-red-50 text-xs font-semibold text-red-700 tabular-nums">{followUp.length}</span>}
          />
          {followUp.length === 0 ? (
            <EmptyState icon={Activity} title="All clear">No babies flagged in the last 48 hours.</EmptyState>
          ) : (
            <ul className="px-2 pb-3">
              {followUp.slice(0, 6).map((r) => {
                const when = screenedAt(r);
                return (
                  <li key={`${r.patientId}-${r.createdAt || r.date}`}>
                    <button type="button" onClick={() => onOpen(r)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer">
                      <Avatar name={r.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900 truncate">{r.name}</span>
                        <span className="block text-[13px] text-slate-500 truncate">{formatAge(r.ageDays)} · {when.time || when.date}</span>
                      </span>
                      <RiskBadge record={r} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent screenings"
          description="The latest results from this unit"
          action={<Button variant="secondary" size="sm" onClick={onRecords}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>}
        />
        {records.length === 0 ? (
          <EmptyState icon={ScanLine} title="No screenings yet" action={<Button icon={Plus} onClick={onNew}>Start first screening</Button>}>
            Screen a baby and the result appears here. Sample photos are available on the New screening page for practice.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[13px] text-slate-500">
                  <th scope="col" className="font-medium py-2.5 pl-5 pr-3">Patient</th>
                  <th scope="col" className="font-medium py-2.5 px-3">Result</th>
                  <th scope="col" className="font-medium py-2.5 pl-3 pr-5 sm:pr-3 text-right">Likelihood</th>
                  <th scope="col" className="font-medium py-2.5 px-3 hidden md:table-cell">Screened by</th>
                  <th scope="col" className="font-medium py-2.5 pl-3 pr-5 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.slice(0, 5).map((r) => {
                  const when = screenedAt(r);
                  return (
                    <tr key={`${r.patientId}-${r.createdAt || r.date}`} onClick={() => onOpen(r)} className="hover:bg-slate-50/80 cursor-pointer transition-colors">
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{r.name}</p>
                            <p className="text-[13px] text-slate-500">{r.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3"><RiskBadge record={r} /></td>
                      <td className="py-3 pl-3 pr-5 sm:pr-3 text-right font-medium text-slate-900 tabular-nums">{pct(probabilityOf(r), 1)}</td>
                      <td className="py-3 px-3 text-slate-600 hidden md:table-cell">{r.doctor || '—'}</td>
                      <td className="py-3 pl-3 pr-5 text-right text-slate-500 whitespace-nowrap hidden sm:table-cell">{when.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {health === 'offline' && (
        <p className="text-sm text-red-700">
          The screening model is offline. New screenings will fail until the model server is running. <Button variant="link" onClick={onModel}>Model status</Button>
        </p>
      )}
    </div>
  );
}
