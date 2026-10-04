# Nova

**Healthy Beginnings, Powered by AI.**

Nova is a neonatal jaundice screening aid for nurses and doctors. A clinician photographs a newborn, and a trained image model estimates how likely the photo shows visible jaundice. The result is sorted into **Normal**, **Borderline** or **High risk**, with recommended next steps.

It comes as a **web portal** (dashboard, screening, patient records, analytics and printable reports) and an **Android/iOS app** that runs the same model offline on the phone.

> **Nova is a screening aid, not a diagnostic test.** A flagged result means "measure bilirubin". It does not replace a serum or transcutaneous bilirubin measurement or a clinician's assessment. The model has not been clinically validated.

## Quick start (Windows, macOS, Linux)

You need **Node.js 20+**, **Git** and **Python 3.10 to 3.13** (3.11 recommended; Python 3.14 does not work with TensorFlow yet).
On Windows, install Python from python.org and tick **"Add python.exe to PATH"**.

```bash
git clone https://github.com/anushka11p/nova.git
cd nova
npm install
npm run setup:ai     # first time only: creates ml/.venv and installs TensorFlow (about 500 MB)
npm run dev          # website :5173, API :5001, AI server :8000
```

Open http://localhost:5173 and sign in (sign-in is simulated for now).

**"The screening model is offline"** means the AI server is not running. Look for lines starting with `[AI server]` in the terminal running `npm run dev`; they say what is missing. `npm run setup:ai` fixes a missing or incomplete Python environment. The first start takes up to a minute while TensorFlow loads.

## The model

| | |
|---|---|
| Architecture | EfficientNetV2B0 (ImageNet transfer learning), fine-tuned in two stages |
| Input | one colour photo, centre-cropped and resized to 224 × 224 |
| Output | probability that the photo shows jaundice |
| Data | 760 newborn photos (200 jaundice, 560 normal) from a single source, split 532 / 114 / 114 |
| Cut-off | **41%**, chosen on the validation photos to catch at least 90% of jaundice |

Results on 114 test photos the model never saw:

| Cut-off | Accuracy | Jaundice caught (sensitivity) | Normal cleared (specificity) | AUC |
|---|---|---|---|---|
| 41% (used by Nova) | 86.8% | 80.0% (24 of 30) | 89.3% (75 of 84) | 0.93 |
| 50% | 91.2% | 76.7% (23 of 30) | 96.4% (81 of 84) | 0.93 |

Below half the cut-off (20.5%) a result is Normal; from there up to the cut-off it is Borderline; at or above the cut-off it is High risk.

**Known limits:** trained on one dataset from a single source; not yet tested across skin tones, cameras or lighting; reads the whole photo and does not measure bilirubin.

Other approaches we trained and compared (MobileNetV2, EfficientNetB0, and a port of a public Kaggle notebook with seven models) are documented with their results in [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Web portal

- **Overview:** today's screenings, high-risk and borderline counts, a 14-day chart, babies needing follow-up and recent screenings.
- **New screening:** upload or take a photo, add the baby's details, and get the result with next steps. Sample photos are included for practice.
- **Patient records:** searchable, filterable list of every screening with its photo.
- **Analytics** from saved screenings, a **Screening model** page with the measured test results, **Settings**, **Help** and a **printable report**.

## Phone app (`mobile/`)

Expo (React Native) app for Android and iOS. The model runs on the phone with TensorFlow Lite, so it works offline and photos never leave the device.

- Welcome screen on first open
- **Home** dashboard, **Screenings** history (search and filters), **Model** information
- Full-screen screening flow: photo, details, result and next steps; results saved on the phone
- Light and dark mode, native iOS and Android conventions

```bash
cd mobile
npm install
npx expo run:android   # needs Android Studio and an emulator or a USB-connected phone
npx expo run:ios       # needs Xcode with an iOS Simulator runtime and CocoaPods
```

Android has been tested on the emulator; iOS has not been run yet.

## How it fits together

```text
Browser (React + Vite, :5173)
   │  /api/*
   ▼
API server (Express, backend/index.js, :5001)  ── records: backend/data/records.json, photos: backend/data/images/
   │  POST /predict
   ▼
AI server (Flask + TensorFlow, backend/app.py, :8000)  ── model: nova_jaundice.keras

Phone app (Expo, mobile/)  ── same model as TensorFlow Lite: mobile/assets/model/nova_jaundice.tflite
```

## Project structure

```text
src/                 Web portal (React 19, Tailwind CSS v4)
  pages/             Landing, sign-in and the portal shell (DashboardPage.jsx)
  portal/            Portal screens, components and shared clinical wording
backend/             Express API (index.js) and Flask AI server (app.py)
ml/                  Model training and evaluation (see ml/README.md)
  efficientnetv2/    The EfficientNetV2B0 model in use: notebook port and evaluation
  kaggle_notebook/   Port of the public "Diagnosis of jaundice" Kaggle notebook (7 models)
mobile/              Android/iOS app (Expo Router)
scripts/             Cross-platform AI server setup and launcher
docs/HANDOFF.md      Full project notes: approaches, results, decisions and status
nova_jaundice.keras  The trained model used by the AI server
model_metrics.json   Measured test results and the decision cut-off
```

## Training your own model

```bash
npm run setup:ai -- --training    # adds the training packages
```

Then follow [`ml/README.md`](ml/README.md). Training scripts write a new `nova_jaundice.keras`, the phone model and `model_metrics.json` together, so the apps pick up the new model and its real scores.

## Status

- Done: trained model, web portal, AI and API servers, Android app.
- In progress: real sign-in and data storage with Supabase (teammate).
- To do: test the iOS app; independent clinical validation before any real-world use.

See [`docs/HANDOFF.md`](docs/HANDOFF.md) for details.

## Disclaimer

Nova is for screening, research and education. It does not diagnose, treat or rule out jaundice, and it is not an approved medical device. Every result must be reviewed by a qualified clinician and confirmed with a bilirubin measurement.
