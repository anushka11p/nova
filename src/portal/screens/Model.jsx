import { Activity, CheckCircle2, Crosshair, Gauge, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import { LikelihoodBar } from '../Result';
import { Card, CardHeader, PageHeader, StatCard } from '../ui';
import { pct } from '../clinical';

const STATUS_STYLE = {
  online: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  offline: 'bg-red-50 text-red-700 ring-red-600/20',
  checking: 'bg-white text-slate-600 ring-slate-500/20',
};

function Confusion({ c }) {
  const cell = (n, label, cls) => (
    <td className={`p-4 text-center rounded-lg ${cls}`}>
      <p className="text-2xl font-semibold tabular-nums">{n}</p>
      <p className="text-[13px]">{label}</p>
    </td>
  );
  return (
    <table className="w-full border-separate border-spacing-2 text-sm">
      <caption className="sr-only">Test-set results at the cut-off</caption>
      <thead>
        <tr className="text-[13px] text-slate-500">
          <th scope="col" />
          <th scope="col" className="font-medium pb-1">Model said normal</th>
          <th scope="col" className="font-medium pb-1">Model flagged</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className="text-left font-medium text-slate-700 pr-2">No jaundice</th>
          {cell(c.tn, 'correctly cleared', 'bg-emerald-50 text-emerald-800')}
          {cell(c.fp, 'false alarms', 'bg-amber-50 text-amber-800')}
        </tr>
        <tr>
          <th scope="row" className="text-left font-medium text-slate-700 pr-2">Jaundice</th>
          {cell(c.fn, 'missed', 'bg-red-50 text-red-800')}
          {cell(c.tp, 'caught', 'bg-emerald-50 text-emerald-800')}
        </tr>
      </tbody>
    </table>
  );
}

export function Model({ metrics, health }) {
  if (!metrics) {
    return (
      <div>
        <PageHeader title="Screening model" />
        <Card className="p-6 text-sm text-slate-500">Model details could not be loaded. Check that the API server is running.</Card>
      </div>
    );
  }
  const t = metrics.test;
  const c = t.confusion;
  const online = health === 'online';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screening model"
        description="What Nova runs and how it performed on photos it had never seen. These numbers come from the last training run."
        badge={
          <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[health] || STATUS_STYLE.checking}`}>
            {online ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {online ? 'Online' : health === 'offline' ? 'Offline' : 'Checking'}
          </span>
        }
      />

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sensitivity" value={pct(t.sensitivity, 1)} hint={`Caught ${c.tp} of ${c.tp + c.fn} jaundice cases`} icon={Crosshair} tone="brand" />
        <StatCard label="Specificity" value={pct(t.specificity, 1)} hint={`Cleared ${c.tn} of ${c.tn + c.fp} normal babies`} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Accuracy" value={pct(t.accuracy, 1)} hint={`Across ${t.n} test photos`} icon={Activity} tone="slate" />
        <StatCard label="AUC" value={t.auc.toFixed(2)} hint="Ranking quality, 0.5 to 1" icon={Gauge} tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Test results at the cut-off" description={`${t.n} photos held back from training`} />
          <div className="px-3 pb-3"><Confusion c={c} /></div>
          <p className="px-5 pb-5 text-sm text-slate-600 max-w-[70ch]">
            The cut-off is set low on purpose. A false alarm costs a bilirubin check; a missed case costs much more.
          </p>
        </Card>

        <Card>
          <CardHeader title="Model details" />
          <dl className="px-5 pb-5">
            {[
              ['Model', metrics.model],
              ['Input', 'One photo, 224 × 224 px'],
              ['Training', `${metrics.split_sizes.train} photos`],
              ['Validation', `${metrics.split_sizes.val} photos`],
              ['Test', `${metrics.split_sizes.test} photos`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Decision cut-off" description="Fixed by training so every screen is judged the same way" />
          <div className="px-5 pb-5 space-y-4">
            <LikelihoodBar probability={null} threshold={metrics.threshold} />
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-800"><span className="font-medium">Normal</span> below {pct(metrics.threshold / 2, 1)}</div>
              <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800"><span className="font-medium">Borderline</span> {pct(metrics.threshold / 2, 1)} to {pct(metrics.threshold)}</div>
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-red-800"><span className="font-medium">High risk</span> {pct(metrics.threshold)} and above</div>
            </div>
            <p className="text-[13px] text-slate-500">Chosen on a separate validation set to catch at least 90% of jaundice cases.</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Known limitations" />
          <ul className="px-5 pb-5 space-y-3">
            {[
              `Trained on ${metrics.split_sizes.train} photos (${metrics.split_sizes.train + metrics.split_sizes.val + metrics.split_sizes.test} in the dataset) from a single source.`,
              'Not yet tested across skin tones, cameras or lighting.',
              'Not clinically validated or approved as a medical device.',
              'Reads the whole photo; it does not measure bilirubin.',
            ].map((l) => (
              <li key={l} className="flex gap-2.5 text-sm text-slate-700">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                {l}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Retraining" description="Runs offline from the project's ml/ folder and replaces the model and these numbers together" />
        <div className="px-5 pb-5">
          <pre className="rounded-lg bg-slate-900 text-slate-100 text-[13px] px-4 py-3 whitespace-pre-wrap break-all">ml/.venv/bin/python ml/train.py --backbone efficientnetb0</pre>
        </div>
      </Card>
    </div>
  );
}
