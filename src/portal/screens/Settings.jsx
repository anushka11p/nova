import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button, Card, CardHeader, Field, PageHeader, inputClass } from '../ui';
import { pct } from '../clinical';

export function Settings({ defaults, onSaveDefaults, metrics, health }) {
  const [draft, setDraft] = useState(defaults);
  const dirty = draft.hospital !== defaults.hospital || draft.doctor !== defaults.doctor;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Preferences for this workstation." />

      <Card>
        <CardHeader title="Screening defaults" description="Pre-filled on every new screening. Stored in this browser only." />
        <form className="px-5 pb-5" onSubmit={(e) => { e.preventDefault(); onSaveDefaults(draft); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unit" htmlFor="set-hospital">
              <input id="set-hospital" className={inputClass()} value={draft.hospital} onChange={(e) => setDraft({ ...draft, hospital: e.target.value })} placeholder="e.g. Postnatal ward 3" />
            </Field>
            <Field label="Screened by" htmlFor="set-doctor">
              <input id="set-doctor" className={inputClass()} value={draft.doctor} onChange={(e) => setDraft({ ...draft, doctor: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={!dirty} onClick={() => setDraft(defaults)}>Cancel</Button>
            <Button type="submit" disabled={!dirty}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="System" description="Read-only information about this installation" />
        <dl className="px-5 pb-5">
          {[
            ['Model server', health === 'online' ? 'Online' : health === 'offline' ? 'Offline' : 'Checking…'],
            ['Model', metrics?.model || '—'],
            ['Decision cut-off', metrics ? `${pct(metrics.threshold)} (set by training)` : '—'],
            ['Data storage', 'Records and photos are stored on this server'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
              <dt className="text-sm text-slate-500">{k}</dt>
              <dd className="text-sm font-medium text-slate-900 text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
        <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Sign-in is simulated in this pilot build. There are no real accounts, access control or audit log yet, so only enter
          patient information allowed under the pilot’s data-handling agreement.
        </p>
      </div>
    </div>
  );
}
