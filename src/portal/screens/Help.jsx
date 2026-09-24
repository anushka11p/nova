import { Camera, Sun, Maximize, RefreshCw } from 'lucide-react';
import { RiskBadge } from '../Result';
import { Card, CardHeader, PageHeader } from '../ui';
import { EARLY_JAUNDICE_RULE, RISKS } from '../clinical';

const TIPS = [
  { icon: Camera, title: 'Undress to the nappy', text: 'Lie the baby on a plain white sheet with chest, tummy and face uncovered.' },
  { icon: Sun, title: 'Use neutral light', text: 'Daylight or white examination light. Turn off yellow lamps and phototherapy lights.' },
  { icon: Maximize, title: 'Fill the frame', text: 'Chest, tummy and face in view, camera steady, about an arm’s length away.' },
  { icon: RefreshCw, title: 'Retake if unsure', text: 'Dark, blurred, shadowed or colour-tinted photos give unreliable results.' },
];

const QA = [
  ['What does Nova do?', 'It looks at one photo of a newborn and estimates how likely the photo shows visible jaundice. The estimate is compared with a fixed cut-off and reported as High risk, Borderline or Normal, with next steps. It does not measure bilirubin.'],
  ['Does it replace a bilirubin test?', 'No. A flagged result means “measure bilirubin”, and a normal result does not rule jaundice out if you are clinically worried. Follow your unit’s jaundice guideline and treatment charts.'],
  ['Why is the cut-off so low?', 'It was set to catch at least 9 in 10 jaundice cases on validation photos. That means more false alarms, which cost a bilirubin check. Missed jaundice costs far more.'],
  ['What is the likelihood percentage?', 'The model’s estimated probability that the photo shows jaundice. It is not a bilirubin level. Use it to see how close a result sits to the cut-off.'],
];

const MEANING = {
  High: 'At or above the cut-off. Measure bilirubin promptly and ask the responsible clinician to review.',
  Moderate: 'Below the cut-off but within half of it. Retake the photo in good light; measure bilirubin if in doubt.',
  Normal: 'Well under the cut-off. Routine care; screen again if the skin or eyes turn yellow.',
};

export function Help() {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Help" description="Taking a good photo and reading the result." />

      <Card>
        <CardHeader title="Taking the photo" />
        <div className="px-5 pb-5 grid gap-4 sm:grid-cols-2">
          {TIPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
              <span className="shrink-0 w-9 h-9 grid place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="w-4 h-4" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="mt-0.5 text-[13px] text-slate-600 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Reading the result" />
        <div className="px-5 pb-2">
          {['High', 'Moderate', 'Normal'].map((k) => (
            <div key={k} className="flex flex-col gap-2 sm:flex-row sm:items-center py-3 border-b border-slate-100">
              <div className="sm:w-32 shrink-0"><RiskBadge risk={RISKS[k]} /></div>
              <p className="text-sm text-slate-700">{MEANING[k]}</p>
            </div>
          ))}
          <p className="py-3 text-[13px] text-slate-500">{EARLY_JAUNDICE_RULE}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Frequently asked questions" />
        <div className="px-5 pb-3 divide-y divide-slate-100">
          {QA.map(([q, a]) => (
            <details key={q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900">
                {q}
                <span className="text-slate-400 transition-transform group-open:rotate-45 text-lg leading-none" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-[70ch]">{a}</p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
