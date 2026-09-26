# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nurses and paediatricians running a clinic pilot, working on hospital workstations and tablets during routine newborn checks. Their job: photograph a newborn, get a fast jaundice screening result, decide whether a bilirubin test is needed, and keep a record of the screening.

## Product Purpose

Nova is a neonatal jaundice screening aid. A clinician uploads a photo of a newborn and a trained image model estimates the likelihood of visible jaundice, sorting the result into Normal, Moderate (borderline) or High risk with a recommended next step. Success means clinicians catch jaundice that needs a bilirubin test without being buried in false alarms, and trust the tool enough to use it on every check. It supports clinical judgement and never replaces a serum or transcutaneous bilirubin measurement.

## Positioning

A non-invasive photo screen, run in seconds by the staff already doing the newborn check, tuned to favour sensitivity (it prefers a false alarm over a missed case) and honest about its own measured performance.

## Operating Context

- Busy ward and clinic settings; screenings happen between other tasks, often on shared workstations or tablets.
- Workflow: register patient details, upload or capture a photo, run analysis, review the result and recommendation, save the record, and print or export a report.
- Supporting areas: patient records registry, reports, screening analytics, model information and training, settings, help.

## Capabilities and Constraints

- Web app: React 19 + Vite + Tailwind CSS v4 frontend, Express API (port 5001), Flask inference server (port 8000) serving `nova_jaundice.keras`.
- Model: EfficientNetV2B0 transfer learning (trained on Kaggle with notebook1d58632c68.ipynb, installed 2026-09-26), input 224×224 RGB, output probability of jaundice; decision threshold 0.41 chosen for ≥90% sensitivity on validation data. Moderate band is threshold/2 to threshold. The previous EfficientNetB0 model is kept in `models_backup/efficientnetb0_v3/`.
- The same model ships on-device in the Expo mobile app (`mobile/`), which is separate from this web portal.
- Authentication is simulated; there is no real account system, database or audit log yet.
- The earlier simulated Grad-CAM view, fake training console and invented statistics have been removed; the portal shows only real records and the measured model metrics.
- Undecided: real authentication, data storage and retention, integration with hospital record systems.

## Brand Commitments

- Product name: **Nova**. The user made the name binding.
- Visual direction (user's standing preference, 2026-09-24): a conventional, professional dashboard at the craft level of Stripe Dashboard, modern EHR / health SaaS (calm, clinical, patient-centred), and shadcn/ui admin layouts. The user rejected a more expressive "ward label" concept as ugly; familiarity and polish are the goal, not novelty.

## Evidence on Hand

- Measured model performance on the notebook's held-out test set of 114 images (`model_metrics.json`), at the 0.41 cut-off: sensitivity 80.0%, specificity 89.3%, accuracy 86.8%, AUC 0.927. At 0.5: sensitivity 76.7%, specificity 96.4%, accuracy 91.2%.
- Training data: 760 newborn photos (200 jaundice, 560 normal; includes 5 exact duplicates) from a single source, split 532 / 114 / 114.
- Sample test images in `test-images/`.
- Absent and must not be fabricated: clinical validation, regulatory approval, hospital partners, user counts, testimonials, published accuracy claims beyond the measured test metrics.

## Product Principles

1. **Safety over reassurance.** Never present a result as more certain than it is; borderline cases are shown as borderline, and every result points to the confirmatory test.
2. **Honest numbers.** Show the model's real probability and measured performance; no invented confidence, claims or social proof.
3. **Fast at the bedside.** A screening should be completable in under a minute by someone mid-shift.
4. **The clinician decides.** Nova recommends; it does not diagnose. The UI keeps the human in charge.

## Accessibility & Inclusion

- Risk levels must never rely on colour alone (text label plus icon).
- The model was trained on a single-source dataset; performance across skin tones, cameras and lighting is not yet validated and must not be implied.
