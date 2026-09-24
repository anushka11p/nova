import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, ImagePlus, Info, Printer, RotateCcw, ScanLine, Upload, X } from 'lucide-react';
import { ResultSummary } from '../Result';
import { Button, Card, CardHeader, Field, PageHeader, inputClass } from '../ui';
import { EARLY_JAUNDICE_RULE, thresholdOf } from '../clinical';

const SAMPLES = [
  { src: '/samples/sample-a.jpg', label: 'Sample A' },
  { src: '/samples/sample-b.jpg', label: 'Sample B' },
  { src: '/samples/sample-c.jpg', label: 'Sample C' },
];

const newId = () => `NEO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
const blankForm = (defaults) => ({ patientId: newId(), name: '', ageDays: '', gender: '', hospital: defaults.hospital, doctor: defaults.doctor, notes: '' });

export function NewScreening({ defaults, metrics, onScreened, onOpenResult, onPrint, showToast }) {
  const [form, setForm] = useState(() => blankForm(defaults));
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('draft'); // draft | analysing | done
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const cameraInput = useRef(null);
  const fileInput = useRef(null);

  useEffect(() => () => photo?.url && URL.revokeObjectURL(photo.url), [photo]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function takeFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setErrors((er) => ({ ...er, photo: 'Use a JPEG, PNG or WebP photo.' }));
      return;
    }
    setPhoto({ file, url: URL.createObjectURL(file), name: file.name, size: file.size });
    setErrors((er) => ({ ...er, photo: undefined }));
  }

  async function useSample(sample) {
    const blob = await (await fetch(sample.src)).blob();
    takeFile(new File([blob], `${sample.label.toLowerCase().replace(' ', '-')}.jpg`, { type: 'image/jpeg' }));
  }

  function validate() {
    const er = {};
    if (!photo) er.photo = 'Add a photo of the baby to screen.';
    if (!form.name.trim()) er.name = 'Enter the baby’s name or identifier.';
    const age = Number(form.ageDays);
    if (form.ageDays === '' || !Number.isInteger(age) || age < 0 || age > 28) er.ageDays = 'Enter the age in whole days, 0 to 28.';
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function analyse(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setPhase('analysing');
    const body = new FormData();
    body.append('image', photo.file);
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    try {
      const res = await fetch('/api/records', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The screening could not be completed.');
      setResult(data);
      setPhase('done');
      onScreened(data);
    } catch (err) {
      setServerError(err.message === 'Failed to fetch' ? 'Nova’s server is not reachable. Check the connection and try again.' : err.message);
      setPhase('draft');
    }
  }

  function reset() {
    setForm(blankForm(defaults));
    setPhoto(null);
    setResult(null);
    setErrors({});
    setServerError('');
    setPhase('draft');
    showToast?.('Form cleared for the next baby.', 'info');
  }

  const locked = phase !== 'draft';

  return (
    <div>
      <PageHeader title="New screening" description="Upload a photo of the baby and add their details. The result appears on the right in a few seconds." />

      <form onSubmit={analyse} noValidate className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Photo" description="Chest, tummy and face in daylight or neutral white light" />
            <div className="px-5 pb-5">
              {photo ? (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 grid place-items-center">
                    <img src={photo.url} alt="Photo to be screened" className="max-h-[360px] w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white">
                    <ImagePlus className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{photo.name}</p>
                      <p className="text-[13px] text-slate-500">{(photo.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    {!locked && (
                      <>
                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>Replace</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)} aria-label="Remove photo"><X className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); takeFile(e.dataTransfer.files[0]); }}
                  className={`rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
                    dragOver ? 'border-brand bg-brand-soft' : errors.photo ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <span className="mx-auto w-11 h-11 grid place-items-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-500">
                    <Upload className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-medium text-slate-900">Drag a photo here, or</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Button type="button" icon={Camera} onClick={() => cameraInput.current?.click()}>Take photo</Button>
                    <Button type="button" variant="secondary" icon={ImagePlus} onClick={() => fileInput.current?.click()}>Browse files</Button>
                  </div>
                  <p className="mt-3 text-[13px] text-slate-500">JPEG, PNG or WebP</p>
                  <div className="mt-5 pt-4 border-t border-slate-200/70 text-[13px] text-slate-500">
                    Practising?{' '}
                    {SAMPLES.map((s, i) => (
                      <span key={s.src}>
                        <button type="button" onClick={() => useSample(s)} className="font-medium text-brand hover:underline underline-offset-4 cursor-pointer">{s.label}</button>
                        {i < SAMPLES.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {errors.photo && <p className="mt-2 text-[13px] text-red-600" role="alert">{errors.photo}</p>}
              <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => takeFile(e.target.files[0])} />
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => takeFile(e.target.files[0])} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Patient details" description={`Screening ID ${form.patientId}`} />
            <fieldset disabled={locked} className="px-5 pb-5 grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <legend className="sr-only">Patient details</legend>
              <Field label="Name or identifier" htmlFor="name" required error={errors.name} className="sm:col-span-2 md:col-span-1 lg:col-span-2">
                <input id="name" className={inputClass(errors.name)} value={form.name} onChange={set('name')} placeholder="e.g. Baby of A. Garcia" autoComplete="off" />
              </Field>
              <Field label="Age (days)" htmlFor="ageDays" required error={errors.ageDays} hint="Day of birth is 0">
                <input id="ageDays" type="number" inputMode="numeric" min="0" max="28" className={inputClass(errors.ageDays)} value={form.ageDays} onChange={set('ageDays')} placeholder="0–28" />
              </Field>
              <Field label="Sex" htmlFor="gender">
                <select id="gender" className={inputClass()} value={form.gender} onChange={set('gender')}>
                  <option value="">Not recorded</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </Field>
              <Field label="Unit" htmlFor="hospital">
                <input id="hospital" className={inputClass()} value={form.hospital} onChange={set('hospital')} placeholder="e.g. Postnatal ward 3" />
              </Field>
              <Field label="Screened by" htmlFor="doctor">
                <input id="doctor" className={inputClass()} value={form.doctor} onChange={set('doctor')} />
              </Field>
              <Field label="Notes" htmlFor="notes" hint="Optional: feeding, TcB readings, anything the reviewer should know" className="sm:col-span-2 md:col-span-1 lg:col-span-2">
                <textarea id="notes" rows={3} className={`${inputClass()} h-auto py-2`} value={form.notes} onChange={set('notes')} />
              </Field>
            </fieldset>
          </Card>
        </div>

        <div className="md:sticky md:top-6 space-y-4">
          <Card>
            <CardHeader title="Result" description={phase === 'done' ? `Completed in ${result.processingTime}` : 'Appears here after analysis'} />
            <div className="px-5 pb-5">
              {phase === 'done' ? (
                <ResultSummary record={result} threshold={thresholdOf(result, metrics)} metrics={metrics} />
              ) : phase === 'analysing' ? (
                <div className="space-y-4 py-2" aria-live="polite">
                  <div className="h-[72px] rounded-lg bg-slate-100 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
                  <div className="h-2 rounded-full bg-slate-100 animate-pulse" />
                  <p className="text-[13px] text-slate-500">Analysing photo…</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                  <ScanLine className="mx-auto w-6 h-6 text-slate-400" aria-hidden="true" />
                  <p className="mt-2 text-sm text-slate-500">Add a photo and details, then run the analysis.</p>
                </div>
              )}

              {serverError && (
                <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm">
                  <p className="font-medium text-red-800">Screening not completed</p>
                  <p className="mt-0.5 text-red-700">{serverError}</p>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {phase === 'done' ? (
                  <>
                    <Button type="button" className="w-full" size="lg" onClick={() => onOpenResult(result)}>
                      View full result <ArrowRight className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="secondary" icon={Printer} onClick={() => onPrint(result)}>Print</Button>
                      <Button type="button" variant="secondary" icon={RotateCcw} onClick={reset}>New baby</Button>
                    </div>
                  </>
                ) : (
                  <Button type="submit" size="lg" className="w-full" loading={phase === 'analysing'} icon={ScanLine}>
                    {phase === 'analysing' ? 'Analysing…' : 'Run analysis'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-600">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <p>{EARLY_JAUNDICE_RULE}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
