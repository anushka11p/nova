// Clinical vocabulary shared by every portal screen.

export const RISKS = {
  High: {
    key: 'High',
    word: 'High risk',
    headline: 'Bilirubin check needed',
    status: 'High Risk',
    badge: 'bg-red-50 text-red-700 ring-red-600/20',
    solid: 'bg-red-600',
    soft: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
  Moderate: {
    key: 'Moderate',
    word: 'Borderline',
    headline: 'Retake photo or check bilirubin',
    status: 'Moderate Risk',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/25',
    solid: 'bg-amber-500',
    soft: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
  },
  Normal: {
    key: 'Normal',
    word: 'Normal',
    headline: 'Routine care',
    status: 'Normal',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    solid: 'bg-emerald-600',
    soft: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
  },
};

const STATUS_TO_KEY = { 'High Risk': 'High', 'Moderate Risk': 'Moderate', Normal: 'Normal' };

export function riskOf(record) {
  return RISKS[record?.risk] || RISKS[STATUS_TO_KEY[record?.status]] || RISKS.Normal;
}

/** Jaundice probability 0..1, or null for records made before the image model stored it. */
export function probabilityOf(record) {
  if (typeof record?.probability === 'number') return record.probability;
  if (record?.modelUsed?.includes('EfficientNet') && typeof record.riskScore === 'number') return record.riskScore / 100;
  return null;
}

export const DEFAULT_THRESHOLD = 0.27;

export function thresholdOf(record, metrics) {
  return record?.threshold ?? metrics?.threshold ?? DEFAULT_THRESHOLD;
}

/** Local calendar day (YYYY-MM-DD) a record was screened on. */
export function localDayKey(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const recordDay = (r) => (r.createdAt ? localDayKey(r.createdAt) : r.date || '');

export const pct = (p, digits = 0) => (p == null ? '—' : `${(p * 100).toFixed(digits)}%`);

export function screenedAt(record) {
  const d = new Date(record.createdAt || record.date);
  if (Number.isNaN(d.getTime())) return { date: record.date || '—', time: '' };
  return {
    date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
    time: record.createdAt ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '',
  };
}

export const EARLY_JAUNDICE_RULE =
  'Visible jaundice in the first 24 hours of life needs an urgent serum bilirubin, whatever this screen shows.';

export const NEXT_STEPS = {
  High: [
    'Measure bilirubin (transcutaneous or serum) promptly and plot it on your unit’s treatment chart.',
    'Ask the responsible clinician to review the baby.',
    'Check feeding, hydration and weight loss.',
  ],
  Moderate: [
    'Re-photograph in daylight or neutral white light and screen again.',
    'Measure bilirubin if there is any clinical concern or the skin or eyes look yellow.',
    'Re-check at the next routine review.',
  ],
  Normal: [
    'Continue routine newborn care.',
    'Screen again or measure bilirubin if the skin or whites of the eyes start to look yellow.',
    'Advise parents what jaundice looks like and when to seek help.',
  ],
};

export function formatAge(ageDays) {
  if (ageDays == null || ageDays === '') return 'Age not recorded';
  return `${ageDays} ${Number(ageDays) === 1 ? 'day' : 'days'}`;
}

export function sexMark(gender) {
  return { Male: 'Male', Female: 'Female' }[gender] || 'Sex not recorded';
}
