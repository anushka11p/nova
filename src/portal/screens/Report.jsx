import { ArrowLeft, Printer } from 'lucide-react';
import { LikelihoodBar, RiskBadge } from '../Result';
import { Button, NovaMark } from '../ui';
import { EARLY_JAUNDICE_RULE, NEXT_STEPS, formatAge, pct, probabilityOf, riskOf, screenedAt, sexMark, thresholdOf } from '../clinical';

export function Report({ record, metrics, onBack }) {
  const risk = riskOf(record);
  const when = screenedAt(record);
  const p = probabilityOf(record);
  const printedAt = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back to result</Button>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[13px] text-slate-500">Choose “Save as PDF” in the print dialog to export.</span>
          <Button icon={Printer} onClick={() => window.print()}>Print report</Button>
        </div>
      </div>

      <article className="report-sheet bg-white border border-slate-200 rounded-xl shadow-sm mx-auto max-w-[210mm] p-8 sm:p-12 text-slate-900 print-card">
        <header className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <NovaMark className="w-9 h-9" />
            <div>
              <p className="text-lg font-semibold leading-tight">Neonatal jaundice screening</p>
              <p className="text-[13px] text-slate-500">Nova screening report</p>
            </div>
          </div>
          <div className="text-right text-[13px]">
            <p className="font-medium">{record.hospital || 'Unit not recorded'}</p>
            <p className="text-slate-500">{when.date}{when.time ? `, ${when.time}` : ''}</p>
          </div>
        </header>

        <section className="grid sm:grid-cols-[minmax(0,1fr)_180px] gap-8 py-6 border-b border-slate-200">
          <div>
            <p className="text-[13px] text-slate-500">Patient</p>
            <p className="text-xl font-semibold">{record.name}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><dt className="text-slate-500">Screening ID</dt><dd className="font-medium">{record.patientId}</dd></div>
              <div><dt className="text-slate-500">Age</dt><dd className="font-medium">{formatAge(record.ageDays)}</dd></div>
              <div><dt className="text-slate-500">Sex</dt><dd className="font-medium">{sexMark(record.gender)}</dd></div>
              <div><dt className="text-slate-500">Screened by</dt><dd className="font-medium">{record.doctor || '—'}</dd></div>
            </dl>
          </div>
          {record.imageUrl && (
            <figure>
              <img src={record.imageUrl} alt="Photo screened" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
              <figcaption className="mt-1.5 text-[11px] text-slate-500">Photo analysed</figcaption>
            </figure>
          )}
        </section>

        <section className="py-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-slate-500">Result</p>
              <div className="mt-1 flex items-center gap-3">
                <RiskBadge record={record} size="lg" />
                <span className="text-sm text-slate-700">{risk.headline}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-slate-500">Jaundice likelihood</p>
              <p className="text-2xl font-semibold tabular-nums">{pct(p, 1)}</p>
            </div>
          </div>
          {p != null && <div className="mt-4"><LikelihoodBar probability={p} threshold={thresholdOf(record, metrics)} /></div>}
        </section>

        <section className="py-6 border-b border-slate-200 grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-semibold mb-2">Recommended next steps</h2>
            <ol className="text-sm space-y-1.5 list-decimal pl-5 text-slate-700">
              {NEXT_STEPS[risk.key].map((s) => <li key={s}>{s}</li>)}
            </ol>
            <p className="mt-3 text-[13px] text-slate-500">{EARLY_JAUNDICE_RULE}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-2">Notes</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.notes || 'None recorded.'}</p>
          </div>
        </section>

        <p className="py-5 text-[12px] text-slate-500 leading-relaxed">
          Nova is a screening aid, not a diagnostic test. The likelihood is the image model’s estimated probability that the photo shows
          jaundice{metrics ? `, compared with a fixed cut-off of ${pct(metrics.threshold)}` : ''}.
          {metrics?.test ? ` On ${metrics.test.n} held-out test photos it caught ${pct(metrics.test.sensitivity, 1)} of jaundice cases and cleared ${pct(metrics.test.specificity, 1)} of normal babies.` : ''}{' '}
          It has not been clinically validated. Confirm with a bilirubin measurement and clinical assessment.
        </p>

        <footer className="grid grid-cols-2 gap-10 pt-8">
          <div>
            <div className="border-b border-slate-400 h-10" />
            <p className="text-[12px] text-slate-500 mt-1.5">Reviewed by (name and signature)</p>
          </div>
          <div>
            <div className="border-b border-slate-400 h-10" />
            <p className="text-[12px] text-slate-500 mt-1.5">Date and time</p>
          </div>
          <p className="col-span-2 text-[11px] text-slate-400">Printed {printedAt} · {record.modelUsed}</p>
        </footer>
      </article>
    </div>
  );
}
