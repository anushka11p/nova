import { ArrowLeft, CheckCircle2, ImageOff, Printer } from 'lucide-react';
import { RiskBadge, ResultSummary } from '../Result';
import { Button, Card, CardHeader, PageHeader } from '../ui';
import { EARLY_JAUNDICE_RULE, NEXT_STEPS, formatAge, riskOf, screenedAt, thresholdOf } from '../clinical';

export function Result({ record, metrics, onBack, onPrint, onNew }) {
  const risk = riskOf(record);
  const when = screenedAt(record);
  const details = [
    ['Screening ID', record.patientId],
    ['Age', formatAge(record.ageDays)],
    ['Sex', record.gender === 'Male' || record.gender === 'Female' ? record.gender : 'Not recorded'],
    ['Unit', record.hospital || '—'],
    ['Screened by', record.doctor || '—'],
    ['Date', `${when.date}${when.time ? `, ${when.time}` : ''}`],
    ['Model', record.modelUsed || '—'],
    ['Processing time', record.processingTime || '—'],
  ];

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to records
      </button>
      <PageHeader
        title={record.name}
        badge={<RiskBadge record={record} size="lg" />}
        description={`${record.patientId} · ${formatAge(record.ageDays)} · Screened ${when.date}${when.time ? ` at ${when.time}` : ''}`}
        actions={
          <>
            <Button variant="secondary" icon={Printer} onClick={() => onPrint(record)}>Print report</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Photo" description="The image the model analysed" />
            <div className="px-5 pb-5">
              {record.imageUrl ? (
                <div className="rounded-lg overflow-hidden bg-slate-900 grid place-items-center">
                  <img src={record.imageUrl} alt={`Photo of ${record.name} used for this screening`} className="max-h-[520px] w-full object-contain" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
                  <ImageOff className="mx-auto mb-2 w-5 h-5 text-slate-400" aria-hidden="true" />
                  No photo stored. This record was created before photos were kept with results.
                </div>
              )}
              <p className="mt-3 text-[13px] text-slate-500">If the photo is dark, blurred or lit by a yellow lamp, screen again with a better photo.</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Patient details" />
            <dl className="px-5 pb-5 grid sm:grid-cols-2 gap-x-8">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                  <dt className="text-sm text-slate-500">{k}</dt>
                  <dd className="text-sm font-medium text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {record.notes && (
              <div className="px-5 pb-5">
                <p className="text-sm text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-900 whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-100 p-3">{record.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader title="Screening result" />
            <div className="px-5 pb-5">
              <ResultSummary record={record} threshold={thresholdOf(record, metrics)} metrics={metrics} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Recommended next steps" />
            <ul className="px-5 pb-4 space-y-3">
              {NEXT_STEPS[risk.key].map((step) => (
                <li key={step} className="flex gap-3 text-sm text-slate-700 leading-snug">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
            <p className="mx-5 mb-5 pt-3 border-t border-slate-100 text-[13px] text-slate-500">{EARLY_JAUNDICE_RULE}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
