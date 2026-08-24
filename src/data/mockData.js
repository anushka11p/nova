// Clinical mock data for Nova jaundice screening platform

export const initialPatientRecords = [
  {
    patientId: "NEO-2026-1995",
    name: "k",
    ageDays: 2,
    gender: "Male",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    date: "2026-08-24",
    prediction: "Normal / Low Risk",
    status: "Normal",
    confidence: 68.51,
    processingTime: "0.8s",
    modelUsed: "CNN-Keras (neobloom_model)",
    notes: "No notes provided.",
    riskScore: 68.51,
    heatmapCoords: {
      x: 51,
      y: 50,
      radius: 15
    }
  },
  {
    patientId: "NEO-2026-9472",
    name: "hnbj",
    ageDays: 4,
    gender: "Male",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    date: "2026-08-24",
    prediction: "Normal / Low Risk",
    status: "Normal",
    confidence: 68.51,
    processingTime: "0.8s",
    modelUsed: "CNN-Keras (neobloom_model)",
    notes: "No notes provided.",
    riskScore: 68.51,
    heatmapCoords: {
      x: 51,
      y: 48,
      radius: 15
    }
  }
];

export const clinicalRecommendations = {
  "High Risk": {
    title: "High Risk - Immediate Attention Required",
    color: "red",
    message: "Consult a pediatrician immediately. Schedule urgent total serum bilirubin (TSB) testing to confirm the clinical severity and prepare for immediate phototherapy evaluation. Monitor hydration and feeding frequency closely (target 8-12 feedings per 24 hours).",
    actions: [
      "Order Urgent Total Serum Bilirubin (TSB) blood test",
      "Evaluate for hospital admission & phototherapy treatment",
      "Assess hydration status and body weight loss percentage",
      "Re-screen within 8-12 hours if outpatient status is maintained"
    ]
  },
  "Moderate Risk": {
    title: "Moderate Risk - Clinical Monitoring Advised",
    color: "yellow",
    message: "Visual check and transcutaneous bilirubin (TcB) verification recommended within 12-24 hours. Ensure adequate feeding (breastfeed or formula every 2-3 hours) to promote bilirubin excretion. Educate parents on monitoring signs of worsening jaundice.",
    actions: [
      "Perform Transcutaneous Bilirubin (TcB) assessment within 12 hours",
      "Assess nursing effectiveness and weight gain tracking",
      "Schedule follow-up clinical visit in 24 hours",
      "Provide parent education brochure on neonatal jaundice"
    ]
  },
  "Normal": {
    title: "Normal - Standard Clinical Care",
    color: "green",
    message: "Routine care and standard newborn checkups. No special interventions required. Advise parents to follow regular feeding recommendations and look out for normal milestones. Re-evaluate only if signs of jaundice develop or deepen.",
    actions: [
      "Continue standard pediatric follow-up schedule",
      "Advise routine feeding patterns (8+ times a day)",
      "Standard pre-discharge education checklist",
      "Re-assess visual inspection during week 1 wellness check"
    ]
  }
};

export const defaultMockStats = {
  totalScreenings: 432,
  highRiskCases: 38,
  todayScreenings: 14,
  modelStatus: "Active",
  modelVersion: "Neonatal-Net v2.1.0",
  modelAccuracy: "96.4% Sensitivity"
};
