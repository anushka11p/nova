import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileSearch, Plus, Search } from 'lucide-react';
import { LikelihoodBar, RiskBadge } from '../Result';
import { Avatar, Button, Card, EmptyState, PageHeader, Tabs } from '../ui';
import { formatAge, pct, probabilityOf, riskOf, screenedAt, thresholdOf } from '../clinical';

const PAGE = 10;

export function Records({ records, metrics, loading, onOpen, onNew, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [flag, setFlag] = useState('All');
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const c = { All: records.length, High: 0, Moderate: 0, Normal: 0 };
    records.forEach((r) => { c[riskOf(r).key] += 1; });
    return c;
  }, [records]);

  const shown = records.filter((r) => {
    const q = query.trim().toLowerCase();
    const matches = !q || r.name?.toLowerCase().includes(q) || r.patientId?.toLowerCase().includes(q) || r.doctor?.toLowerCase().includes(q);
    return matches && (flag === 'All' || riskOf(r).key === flag);
  });
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages - 1);
  const slice = shown.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <div>
      <PageHeader
        title="Patient records"
        description="Every screening saved in this installation, newest first."
      />

      <Card>
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-xs">
            <span className="sr-only">Search records</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search name, ID or screener"
              className="block w-full h-9 pl-9 pr-3 rounded-lg bg-white text-sm border border-slate-200 shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-ring/60"
            />
          </label>
          <div className="overflow-x-auto">
            <Tabs
              label="Filter by result"
              value={flag}
              onChange={(v) => { setFlag(v); setPage(0); }}
              options={[
                { value: 'All', label: 'All', count: counts.All },
                { value: 'High', label: 'High risk', count: counts.High },
                { value: 'Moderate', label: 'Borderline', count: counts.Moderate },
                { value: 'Normal', label: 'Normal', count: counts.Normal },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[60px] px-5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                <div className="h-3.5 w-40 rounded bg-slate-100 animate-pulse" />
                <div className="h-5 w-20 rounded bg-slate-100 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState icon={FileSearch} title="No screenings yet" action={<Button icon={Plus} onClick={onNew}>Start first screening</Button>}>
            Each screening is saved here with its photo, result and screener, ready to reopen or print.
          </EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState icon={Search} title="No matching records">
            Nothing matches your search{flag !== 'All' ? ' and filter' : ''}. Check the spelling or clear the filter.
          </EmptyState>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[13px] text-slate-500">
                    <th scope="col" className="font-medium py-2.5 pl-5 pr-3">Patient</th>
                    <th scope="col" className="font-medium py-2.5 px-3">Age</th>
                    <th scope="col" className="font-medium py-2.5 px-3">Result</th>
                    <th scope="col" className="font-medium py-2.5 px-3 w-[22%]">Likelihood</th>
                    <th scope="col" className="font-medium py-2.5 px-3 hidden lg:table-cell">Screened by</th>
                    <th scope="col" className="font-medium py-2.5 px-3">Date</th>
                    <th scope="col" className="py-2.5 pr-4"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((r) => {
                    const when = screenedAt(r);
                    const p = probabilityOf(r);
                    return (
                      <tr key={`${r.patientId}-${r.createdAt || r.date}`} onClick={() => onOpen(r)} className="group hover:bg-slate-50/80 cursor-pointer transition-colors">
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.name} />
                            <div className="min-w-0">
                              <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(r); }} className="block font-medium text-slate-900 truncate text-left cursor-pointer">{r.name}</button>
                              <p className="text-[13px] text-slate-500">{r.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{formatAge(r.ageDays)}</td>
                        <td className="py-3 px-3"><RiskBadge record={r} /></td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <span className="w-12 text-right font-medium text-slate-900 tabular-nums">{pct(p, 1)}</span>
                            {p != null && <div className="flex-1 min-w-[80px]"><LikelihoodBar probability={p} threshold={thresholdOf(r, metrics)} showScale={false} compact /></div>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 hidden lg:table-cell">{r.doctor || '—'}</td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{when.date}<span className="block text-[13px] text-slate-400">{when.time}</span></td>
                        <td className="py-3 pr-4 text-right"><ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 inline" aria-hidden="true" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden divide-y divide-slate-100">
              {slice.map((r) => {
                const when = screenedAt(r);
                return (
                  <li key={`${r.patientId}-${r.createdAt || r.date}`}>
                    <button type="button" onClick={() => onOpen(r)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer active:bg-slate-50">
                      <Avatar name={r.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900 truncate">{r.name}</span>
                        <span className="block text-[13px] text-slate-500 truncate">{formatAge(r.ageDays)} · {when.date}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <RiskBadge record={r} />
                        <span className="text-[13px] font-medium text-slate-700 tabular-nums">{pct(probabilityOf(r), 1)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 text-[13px] text-slate-500">
              <span>
                Showing {current * PAGE + 1}–{Math.min(shown.length, current * PAGE + PAGE)} of {shown.length}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="secondary" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
