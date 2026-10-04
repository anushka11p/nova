# Nova: project notes and handoff

Last updated 2026-10-04. Read this first when resuming work.

## Where things are

| What | Location |
|---|---|
| Project (the only current copy) | `~/code/nova-main` |
| GitHub | https://github.com/anushka11p/nova (branch `main`, last pushed commit `e243a2f`) |
| Dataset (760 photos) | `~/Downloads/neoBloom/datasets/{jaundice,normal}` |
| Old copy, do not use | `~/Documents/nova-main` (iCloud offloads its files; everything there is outdated) |

Run the web app (website on :5173, API on :5001, AI server on :8000):

```bash
cd ~/code/nova-main && npm run dev
```

The AI server uses the Python environment in `ml/.venv` (created with `uv venv -p 3.11`).

## Current state

- **Model in use:** EfficientNetV2B0 (`nova_jaundice.keras`), trained on Kaggle with `notebook1d58632c68.ipynb`. The phone copy is `mobile/assets/model/nova_jaundice.tflite`. Scores and the cut-off are in `model_metrics.json`.
- **Web portal:** professional dashboard (Overview, New screening, Patient records, Analytics, Screening model, Settings, Help, printable report). All numbers are real; the earlier fake heatmap, training console and invented stats are gone.
- **Phone app:** redesigned and running on the Android emulator (2026-10-04). A welcome screen on first open; tabs **Home** (dashboard like the web Overview: greeting, New screening, today's stats, Needs follow-up, 14-day chart, Recent), **Screenings** (full history with filters and search) and **Model**; full-screen New screening flow; result detail; history saved on the phone; light and dark mode. iOS is untested (no iOS Simulator runtime installed).

## Model approaches tried

All scores are on held-out photos the model never trained on. Sensitivity = jaundice cases caught; specificity = normal babies correctly cleared.

| # | Approach | Test set | Cut-off | Accuracy | Sensitivity | Specificity | AUC | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | MobileNetV2, own pipeline (`ml/train.py`) | 112 | 0.10 | 69.6% | 82.8% | 65.1% | 0.81 | Superseded |
| 2 | EfficientNetB0, own pipeline (`ml/train.py`) | 112 | 0.27 | 84.8% | 89.7% | 83.1% | 0.91 | Previous model; backup in `models_backup/efficientnetb0_v3/` (local only) and in git commit `f98930d` |
| 3 | Kaggle "Diagnosis of jaundice" notebook, 7 models (`ml/kaggle_notebook/`) | 152 | 0.5 | best: CNN 78.3% | CNN 70.3% | CNN 80.9% | CNN 0.80 | Reference only |
| 4 | EfficientNetV2B0 from `notebook1d58632c68.ipynb`, trained on Kaggle (`ml/efficientnetv2/`) | 114 | 0.41 | 86.8% | 80.0% | 89.3% | 0.927 | **In use** |

Details:

1. **Own pipeline (`ml/prepare_split.py`, `ml/train.py`).** Removes 5 exact duplicate photos, keeps near-duplicate shots in the same split, splits 70/15/15. Two-stage transfer learning: train a new head, then fine-tune the top 40 backbone layers at a low learning rate. Class weights for the 200 vs 560 imbalance; augmentation never changes colour. The cut-off is the highest value that still catches 90% of jaundice on the validation set.
2. **Kaggle notebook port (`ml/kaggle_notebook/diagnosis_of_jaundice.py`).** Faithful port of snmahsa's public notebook with one fix: the original never shuffled its data, so every deep-model validation image was a normal baby and all deep-model scores on Kaggle were meaningless. All 7 models now share one seed-42 split. Both EfficientNet variants predict "normal" for every photo (0% sensitivity). The classical models work on 64×64 grayscale, which discards the yellow colour, and catch only 16–19% of jaundice. `predict.py` in that folder runs any of the 7.
3. **EfficientNetV2B0 (installed 2026-09-26).** EfficientNetV2B0 with built-in preprocessing, a head of batch norm, dropout 0.35, dense 128 and dropout 0.25, class weights, two stages (frozen, then the last 30 layers at 1e-5). At the notebook's 0.5 cut-off: accuracy 91.2%, sensitivity 76.7%, specificity 96.4%. The scores printed inside the notebook belong to an earlier Kaggle run, not this file; `ml/efficientnetv2/evaluate_received.py` measured the numbers above on the notebook's exact split. The phone copy was rebuilt in float32 because TFLite cannot convert the Kaggle mixed-precision model (difference from the original ≤ 0.004).

The test sets differ between approaches, so rows are only roughly comparable. The model trade-off: #2 catches more jaundice, #4 raises far fewer false alarms and ranks better overall (AUC).

## Lessons learned

- **Keep the project out of `~/Documents`.** iCloud "Optimize Mac Storage" offloaded most project files, which stalled builds, installs and the AI server.
- **XGBoost on macOS** needs `brew install libomp`.
- **Mixed-precision Kaggle models** must be rebuilt in float32 before TFLite conversion (see the conversion step in the 2026-09-26 session).
- **TensorFlow does not support Python 3.14** yet; environments use Python 3.11.
- **Accuracy alone misleads here:** 74% of photos are normal, so always saying "normal" scores about 75%. Always report sensitivity and specificity.

## Web portal design

Direction recorded in `PRODUCT.md` (Brand Commitments): a conventional, professional dashboard at the level of Stripe, modern health software and shadcn/ui. A more expressive "ward label" concept was built and rejected. Code: `src/pages/DashboardPage.jsx` (shell) and `src/portal/` (screens, components, `clinical.js` for shared risk wording and logic).

Open items: an independent design review of the current version, and writing `DESIGN.md`.

## Phone app redesign: the plan

Decisions confirmed with the user on 2026-09-27:

- **Users:** nurses and doctors at the bedside.
- **Scope:** screen a baby, keep a history on the phone, fully offline. The model runs on the device and photos never leave it.
- **Layout (worklist-first):**
  - Tab **Screenings**: today's babies, with high-risk and borderline pinned under "Needs follow-up", then earlier days grouped by date; search by name or ID.
  - **New screening** is a primary action, not a tab. It opens a full-screen flow: photo → details → result → Done returns to the list with the new baby on top.
  - Tapping a baby opens its **result detail**: photo, status, likelihood bar against the cut-off, next steps, details, notes.
  - Tab **Model**: measured accuracy from `model_metrics.json` (one decimal, never rounded up), photo tips, known limitations.
- **Look:** the web portal's world. Nova teal tint (light `#0F766E`; a lighter teal for dark mode), slate neutrals, calm cards and lists, risk always shown as icon plus word. Platform conventions win on structure: system fonts (SF / Roboto), native tab bar and stack, safe areas, system Back and edge-swipe, touch targets of at least 44 pt (iOS) and 48 dp (Android), and light and dark mode as first-class. On Android the New screening action is a floating action button; on iOS a prominent button in the header area.
- **Design record:** `.impeccable/surfaces/mobile-app-tsx.md`.

### Technical plan

1. **Reinstall dependencies** (`mobile/node_modules` was not copied when the project moved): `cd ~/code/nova-main/mobile && npm install`.
2. **Add packages** with `npx expo install` (never plain npm, so versions match SDK 57): `expo-router` and its peers, `expo-file-system`, and icons (`expo-symbols`, falling back to `@expo/vector-icons` on Android if needed). The project's `AGENTS.md` asks for Expo Router with routes in `src/app/`.
3. **Routes** (Expo Router, `mobile/src/app/`):
   - `_layout.tsx`: root stack; the new-screening flow presented full-screen modal
   - `(tabs)/_layout.tsx`: tabs Screenings and Model
   - `(tabs)/index.tsx`: the worklist
   - `(tabs)/model.tsx`: model information
   - `screening/[id].tsx`: result detail
   - `new.tsx`: the photo → details → result flow
4. **Storage** (`mobile/src/lib/store.ts`), with the SDK 57 file API (`import { File, Directory, Paths } from 'expo-file-system'`; the old `readAsStringAsync` style is deprecated):
   - folder `Paths.document/screenings/`
   - `records.json` holds the list, newest first
   - each photo is copied in as `<id>.jpg`
   - record fields mirror the web API: `patientId`, `name`, `ageDays`, `gender`, `unit`, `screenedBy`, `notes`, `createdAt`, `probability`, `threshold`, `risk`, `modelUsed`, `ms`, `photoUri`.
5. **Keep** `mobile/src/screening.ts` (centre-crop, resize to 224, raw 0–255 pixels, TFLite run). It already matches the installed model; risk bands are cut-off and half cut-off.
6. **Theme and components** (`mobile/src/theme.ts`, `mobile/src/components/`): colour tokens for light and dark, RiskBadge, LikelihoodBar, list row, section header, buttons, empty state.
7. **Verify** on the Android emulator (Pixel_8_Pro; `npm run android` builds the development app, about 10 minutes the first time): run a real screening with the sample photos in `public/samples/`, check light and dark mode, take screenshots. iOS needs an iOS Simulator runtime first (Xcode → Settings → Components); it is not installed.
8. **Finish:** design review and fixes, then commit and push.

## 2026-10-04 session notes

- **Phone app built and checked on Android** (Pixel 8 Pro emulator), light and dark: Sample A gave High risk 57.2%, Sample C gave High risk 41.2% (just over the 41% cut-off). `npx expo lint`, `npx tsc --noEmit` and `npx expo-doctor` all pass.
- **Web server preprocessing fixed:** `backend/app.py` now resizes with `tf.image.resize` (bilinear, no antialiasing), exactly as the EfficientNetV2B0 model was trained. The old PIL resize suited the previous model and skewed borderline scores (Sample C read 28.5% instead of about 41%). Web and phone now agree.
- **Disk space:** the Mac ran out of space during the Android build. Freed about 11 GB by clearing npm/pip/node-gyp/Playwright caches, the old `~/Documents/nova-main` copy and the Kaggle notebook model files (approved by the user). A full disk corrupts Gradle caches; if Android builds fail oddly after that, clear `~/.gradle/caches/build-cache-1`, `mobile/android/.gradle` and `node_modules/*/android/build`.
- **Android NDK:** an interrupted build leaves an empty `~/Library/Android/sdk/ndk/<version>` folder that breaks later builds; delete it and Gradle re-downloads it.
- **Run the phone app:** boot the emulator, then `cd mobile && npx expo run:android` (later runs only need `npx expo start` while the development build is installed).

## Sign-in and data storage (owned by a teammate, Supabase)

A teammate is adding real authentication with Supabase. Integration points:

- **Web sign-in:** `src/pages/AuthPage.jsx` is simulated today (including a "Direct Sandbox Bypass" button to remove). `src/App.jsx` keeps the signed-in user as `currentUser` and passes it to `DashboardPage`; the portal shows the name and pre-fills "Screened by" from it.
- **Records:** `backend/index.js` (`POST /api/records`, `GET /api/records`) stores records in `backend/data/records.json` and photos in `backend/data/images/`. Moving these to a Supabase table and Storage only needs the API to keep returning the same record fields (see the record built in `POST /api/records`).
- **API protection:** the Express API has no auth; it should verify the Supabase session on each request.
- **Phone app:** no sign-in; history is stored only on the device (`mobile/src/lib/store.tsx`). Connect Supabase there if phone results should sync with the portal or require login.

## Other open items

- Push the phone redesign (not yet committed).
- The web landing page (`src/pages/LandingPage.jsx`, before sign-in) still has invented claims from the original project ("Trusted by 500+ neonatologists", "Clinical Grade AI", "without painful blood tests"); it was outside the portal redesign and should be cleaned up.
- Test on iOS once an iOS Simulator runtime is installed (Xcode → Settings → Components).
- Web portal: design review and `DESIGN.md`.
- Real sign-in, access control and an audit log: in progress by a teammate (Supabase), see above.
- Optional: retrain approach #2 and approach #4 on one shared split for a strict head-to-head comparison.
- Optional: lower the in-use model's cut-off if catching more jaundice matters more than false alarms (currently 80% caught at 0.41).
