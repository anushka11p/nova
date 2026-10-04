// Clinical wording shared by every screen. Kept in step with the web portal (src/portal/clinical.js).
import metrics from '../../assets/model/model_metrics.json';

export type RiskKey = 'High' | 'Moderate' | 'Normal';

export const MODEL = metrics;
export const THRESHOLD: number = metrics.threshold;
export const MODEL_NAME: string = metrics.model;

export const RISKS: Record<RiskKey, { word: string; headline: string }> = {
  High: { word: 'High risk', headline: 'Bilirubin check needed' },
  Moderate: { word: 'Borderline', headline: 'Retake photo or check bilirubin' },
  Normal: { word: 'Normal', headline: 'Routine care' },
};

/** Bands: High at or above the cut-off, Borderline from half the cut-off, Normal below. */
export function riskFor(probability: number, threshold = THRESHOLD): RiskKey {
  if (probability >= threshold) return 'High';
  if (probability >= threshold / 2) return 'Moderate';
  return 'Normal';
}

export const NEXT_STEPS: Record<RiskKey, string[]> = {
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

export const EARLY_JAUNDICE_RULE =
  'Visible jaundice in the first 24 hours of life needs an urgent serum bilirubin, whatever this screen shows.';

export const pct = (p: number | null | undefined, digits = 0) => (p == null ? '—' : `${(p * 100).toFixed(digits)}%`);

export function formatAge(ageDays: number | null) {
  if (ageDays == null) return 'Age not recorded';
  return `${ageDays} ${ageDays === 1 ? 'day' : 'days'}`;
}

export function trustLine() {
  const t = metrics.test;
  return `On ${t.n} test photos it had never seen, the model caught ${pct(t.sensitivity, 1)} of jaundice cases and cleared ${pct(
    t.specificity,
    1,
  )} of normal babies. A bilirubin measurement decides.`;
}
