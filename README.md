# Nova

**Healthy Beginnings, Powered by AI.**

NeoBloom is a modern, responsive frontend application for an AI-powered neonatal jaundice screening platform. It is designed to simulate a professional hospital dashboard where healthcare professionals can register newborn patients, upload images, view screening progress, review AI-generated risk assessments, manage patient records, and generate medical reports.

The current version is a frontend-only prototype built using placeholder data. It does not include backend authentication, database storage, or real AI prediction logic.

---

## Overview

Neonatal jaundice is a common condition in newborn babies caused by elevated bilirubin levels. Early identification is important because severe untreated jaundice may lead to serious health complications.

NeoBloom presents a non-invasive screening workflow where an image of the newborn can be uploaded and analysed through an AI-assisted interface. The application demonstrates how such a system could support medical professionals by providing screening results, confidence scores, risk classifications, visual explanations, and structured reports.

> NeoBloom is intended for screening, research, educational, and demonstration purposes only. It does not replace professional medical diagnosis.

---

## Features

### Landing Page

* NeoBloom branding and healthcare-focused design
* Hero section with the title “NeoBloom”
* AI-powered neonatal jaundice screening description
* “Start Screening” and “Learn More” call-to-action buttons
* Platform feature cards
* About section
* Contact and research information
* Responsive footer

### Authentication

* Login page
* Sign-up page
* Forgot-password page
* Secure authentication-style interface
* Form validation-ready components
* Password visibility controls
* Remember-me option

Authentication is currently simulated and does not connect to a real authentication service.

### Dashboard

The main dashboard provides a quick overview of screening activity.

Dashboard statistics include:

* Total Screenings
* High-Risk Cases
* Today’s Screenings
* AI Model Status

The dashboard also includes:

* Recent screening activity
* Risk-status badges
* Quick actions
* Screening trends
* Model status indicators
* Responsive sidebar navigation

### New Screening

The screening workflow contains a complete patient information form.

Patient fields include:

* Patient ID
* Baby Name
* Age in days
* Gender
* Hospital Name
* Doctor Name
* Clinical Notes

The image upload section includes:

* Drag-and-drop upload area
* File upload button
* Image preview
* File validation-ready interface
* Replace and remove image options

### AI Analysis Progress

The screening page displays an animated multi-stage analysis workflow:

1. Upload Complete
2. Image Quality Check
3. Image Preprocessing
4. AI Analysis
5. Prediction Complete

The current analysis process is simulated using frontend state and placeholder timings.

### Screening Results

The results page displays:

* Prediction
* Confidence Score
* Risk Level
* Processing Time
* AI Model Used
* Original Uploaded Image
* Explainable AI Heatmap placeholder
* Confidence Meter
* Medical Recommendation Card

Risk results use three visual states:

* Green — Normal
* Yellow — Moderate Risk
* Red — High Risk

Recommendations change depending on the selected prediction status.

### Reports

The report page presents a structured medical-style screening report containing:

* Patient Information
* Uploaded Image
* Prediction
* Confidence Score
* Risk Level
* Medical Recommendation
* Screening Date and Time
* AI Model Information
* Screening Disclaimer

Available actions include:

* Download PDF
* Print Report
* Save Record

These actions are currently represented through frontend interactions and may require additional libraries or backend integration for full functionality.

### Patient Records

The patient records page contains a searchable and filterable table.

Table fields include:

* Patient ID
* Name
* Date
* Prediction
* Status
* View Details

Additional interface elements may include:

* Search by name or patient ID
* Risk-level filters
* Date filters
* Pagination
* Patient details modal
* Record status badges

### Analytics

The analytics page includes placeholder visualisations for:

* Weekly Screenings
* Prediction Distribution
* Risk-Level Breakdown
* Screening Activity Trends
* Model Confidence Summary

The charts use placeholder data and can later be connected to real screening records.

### Settings

Settings include:

* Theme Selection
* Notification Preferences
* Account Settings
* Profile Information
* Password Management
* AI Model Information
* Model Version
* Screening Thresholds
* Application Preferences

### Shared UI Components

NeoBloom uses reusable interface components such as:

* Cards
* Buttons
* Form Inputs
* Select Menus
* Progress Bars
* Tables
* Badges
* Charts
* Modals
* Toast Notifications
* Breadcrumb Navigation
* Tooltips
* Loading States
* Empty States
* Confirmation Dialogs

---

## Application Navigation

The main sidebar includes:

* Dashboard
* New Screening
* Patient Records
* Reports
* Analytics
* Settings
* Help

The sidebar is responsive and collapses into a mobile navigation drawer on smaller devices.

---

## Design System

NeoBloom follows a clean healthcare dashboard design.

### Visual Style

* White background
* Soft blue accents
* Teal highlights
* Pastel green success states
* Yellow moderate-risk states
* Red high-risk states
* Rounded cards
* Subtle shadows
* Smooth transitions
* Minimal and professional layout

### Design Goals

* Medical professionalism
* Clear information hierarchy
* Accessible status indicators
* Low visual clutter
* Easy navigation
* Responsive layouts
* Trustworthy and research-oriented branding

---

## Technology Stack

* React or Next.js
* TypeScript or JavaScript
* Tailwind CSS
* React Router or Next.js App Router
* Recharts or Chart.js
* Lucide React Icons
* React Hook Form
* Zod
* Framer Motion
* React Hot Toast or Sonner

The exact dependencies may vary depending on the implementation.

---

## Suggested Project Structure

```text
neobloom/
├── public/
│   ├── images/
│   ├── icons/
│   └── logo/
│
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── screening/
│   │   ├── results/
│   │   ├── reports/
│   │   ├── patients/
│   │   ├── analytics/
│   │   ├── settings/
│   │   ├── help/
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNavigation.tsx
│   │   │   └── PageContainer.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── RecentScreenings.tsx
│   │   │   └── ModelStatus.tsx
│   │   │
│   │   ├── screening/
│   │   │   ├── PatientForm.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   └── AnalysisProgress.tsx
│   │   │
│   │   ├── results/
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── ConfidenceMeter.tsx
│   │   │   ├── RiskBadge.tsx
│   │   │   ├── HeatmapPreview.tsx
│   │   │   └── RecommendationCard.tsx
│   │   │
│   │   ├── reports/
│   │   │   └── ScreeningReport.tsx
│   │   │
│   │   ├── patients/
│   │   │   ├── PatientTable.tsx
│   │   │   └── PatientDetailsModal.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── WeeklyScreeningsChart.tsx
│   │   │   ├── PredictionChart.tsx
│   │   │   └── RiskBreakdownChart.tsx
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       ├── Progress.tsx
│   │       └── Breadcrumb.tsx
│   │
│   ├── data/
│   │   ├── patients.ts
│   │   ├── screenings.ts
│   │   ├── analytics.ts
│   │   └── recommendations.ts
│   │
│   ├── hooks/
│   │   ├── useScreening.ts
│   │   ├── useImageUpload.ts
│   │   └── useToast.ts
│   │
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── validators.ts
│   │
│   ├── types/
│   │   ├── patient.ts
│   │   ├── screening.ts
│   │   └── report.ts
│   │
│   └── styles/
│       └── globals.css
│
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/neobloom.git
```

Open the project directory:

```bash
cd neobloom
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

For a Vite-based React project, the default URL may be:

```text
http://localhost:5173
```

---

## Available Scripts

### Start Development Server

```bash
npm run dev
```

### Create Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Linting

```bash
npm run lint
```

---

## Placeholder Screening Workflow

The current frontend screening flow works as follows:

1. A user enters patient information.
2. A neonatal image is uploaded.
3. The image preview is displayed.
4. The application simulates image-processing stages.
5. A placeholder prediction is generated.
6. The user is redirected to the results page.
7. A medical-style report can be viewed and printed.

No medical inference is performed in the current implementation.

---

## Example Placeholder Result

```json
{
  "patientId": "NB-2026-0012",
  "babyName": "Baby Aarav",
  "ageDays": 5,
  "gender": "Male",
  "hospitalName": "NeoBloom Children’s Hospital",
  "doctorName": "Dr. Meera Sharma",
  "prediction": "Moderate Jaundice Risk",
  "confidence": 88.4,
  "riskLevel": "Moderate",
  "processingTime": "2.4 seconds",
  "modelUsed": "NeoBloom Vision Model v1.0",
  "recommendation": "Clinical bilirubin assessment is recommended."
}
```

---

## Risk Classification

### Normal

The screening does not indicate significant visible signs associated with neonatal jaundice.

Recommended interface colour:

```text
Green
```

### Moderate Risk

The screening indicates possible visible signs that require professional clinical assessment.

Recommended interface colour:

```text
Yellow
```

### High Risk

The screening indicates strong visible signs that require immediate professional medical evaluation.

Recommended interface colour:

```text
Red
```

The displayed classifications are placeholders and must not be interpreted as real medical results.

---

## Accessibility

The interface should follow accessible design practices, including:

* Semantic HTML
* Keyboard navigation
* Screen-reader labels
* Sufficient colour contrast
* Visible focus states
* Descriptive form errors
* Accessible modal dialogs
* Non-colour risk indicators
* Responsive text sizing

Risk levels should always include text labels and icons instead of relying only on colour.

---

## Responsive Design

NeoBloom is designed for:

* Desktop computers
* Hospital workstations
* Tablets
* Mobile devices

Responsive behaviours include:

* Collapsible sidebar
* Mobile navigation drawer
* Stacked dashboard cards
* Horizontally scrollable tables
* Adaptive forms
* Responsive charts
* Touch-friendly buttons
* Flexible image previews

---

## Future Enhancements

Potential future improvements include:

* Real backend authentication
* Role-based access control
* Doctor and administrator accounts
* Secure patient database
* Real image-processing pipeline
* Machine-learning model integration
* Bilirubin risk estimation
* Skin-colour calibration
* Camera and lighting validation
* Grad-CAM heatmap generation
* Model confidence calibration
* Hospital information-system integration
* Electronic medical record integration
* PDF report generation
* Email report sharing
* Cloud image storage
* Audit logging
* Multi-language support
* Offline screening support
* Mobile application
* Clinical validation dashboard

---

## Backend Integration Plan

A future backend could provide endpoints such as:

```text
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/forgot-password

GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id

POST   /api/screenings
GET    /api/screenings
GET    /api/screenings/:id

POST   /api/screenings/:id/analyse
GET    /api/screenings/:id/results

GET    /api/reports/:id
POST   /api/reports/:id/export

GET    /api/analytics/summary
GET    /api/models/status
```

---

## Security Considerations

A production medical platform should implement:

* HTTPS
* Secure authentication
* Multi-factor authentication
* Role-based access control
* Encrypted patient data
* Secure file uploads
* Audit logs
* Session expiration
* Rate limiting
* Input sanitisation
* Access monitoring
* Data-retention policies
* Backup and recovery procedures

The current frontend prototype does not provide these protections.

---

## Medical and Ethical Considerations

Before any real-world deployment, NeoBloom would require:

* Clinical validation
* Bias assessment
* Testing across different skin tones
* Camera and lighting standardisation
* Model explainability
* False-negative analysis
* False-positive analysis
* Medical professional supervision
* Patient-data privacy review
* Regulatory approval
* Informed consent procedures
* Secure health-data storage

AI screening results must always be reviewed by qualified medical professionals.

---

## Disclaimer

**This application is intended for screening and research purposes only and does not replace professional medical diagnosis.**

NeoBloom is currently a frontend demonstration using simulated data and placeholder predictions. It must not be used to diagnose, treat, prevent, or manage any medical condition.

---

## Branding

### Application Name

**NeoBloom**

### Tagline

**Healthy Beginnings, Powered by AI.**

### Product Description

NeoBloom is an AI-assisted neonatal jaundice screening interface designed to support faster, non-invasive, and accessible early screening workflows.

---

## Contributing

Contributions are welcome for improving the frontend design, accessibility, responsiveness, component architecture, and user experience.

To contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes.

```bash
git commit -m "Add your feature"
```

4. Push the branch.

```bash
git push origin feature/your-feature-name
```

5. Open a pull request.

---

## Licence

This project is intended for educational, research, demonstration, and portfolio purposes.

Add an appropriate open-source licence, such as the MIT Licence, before public distribution.

---

## Contact

For research collaboration, development enquiries, or project feedback, contact the NeoBloom project team through the repository’s issue tracker or the contact information provided in the application.

---

## Project Status

```text
Frontend UI: Completed / In Development
Backend: Not Implemented
Authentication: UI Only
Database: Not Implemented
AI Model: Not Implemented
Medical Validation: Not Conducted
Production Use: Not Approved
```

---

Built with care for healthier beginnings.

**NeoBloom — Healthy Beginnings, Powered by AI.**
