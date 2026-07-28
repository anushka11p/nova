// Clinical mock data for NeoBloom jaundice screening platform

export const initialPatientRecords = [
  {
    patientId: "NEO-2026-8841",
    name: "Baby Garcia",
    ageDays: 4,
    gender: "Male",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    date: "2026-07-28",
    prediction: "Jaundice Detected",
    status: "High Risk",
    confidence: 94.8,
    processingTime: "1.2s",
    modelUsed: "Neonatal-Net v2",
    notes: "Slight yellowing of the sclera noted. Skin color shows visible bilirubin tint. Parents request rapid non-invasive screening.",
    riskScore: 94.8,
    heatmapCoords: { x: 50, y: 45, radius: 60 }
  },
  {
    patientId: "NEO-2026-1092",
    name: "Baby Olivia",
    ageDays: 3,
    gender: "Female",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    date: "2026-07-27",
    prediction: "Normal / Low Risk",
    status: "Normal",
    confidence: 91.2,
    processingTime: "1.0s",
    modelUsed: "Neonatal-Net v2",
    notes: "Healthy skin tone, screening completed as part of regular discharge procedure.",
    riskScore: 12.5,
    heatmapCoords: { x: 50, y: 50, radius: 20 }
  },
  {
    patientId: "NEO-2026-5542",
    name: "Baby Liam",
    ageDays: 5,
    gender: "Male",
    hospital: "General Children's Hospital",
    doctor: "Dr. Marcus Vance",
    date: "2026-07-26",
    prediction: "Mild Bilirubin Elevation",
    status: "Moderate Risk",
    confidence: 84.5,
    processingTime: "1.1s",
    modelUsed: "Neonatal-Net v2",
    notes: "Borderline physical assessment. Transcutaneous bilirubin (TcB) meter showed 11.2 mg/dL. Screening scheduled for AI comparison.",
    riskScore: 56.4,
    heatmapCoords: { x: 48, y: 40, radius: 45 }
  },
  {
    patientId: "NEO-2026-9211",
    name: "Baby Sophia",
    ageDays: 2,
    gender: "Female",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    date: "2026-07-25",
    prediction: "Normal / Low Risk",
    status: "Normal",
    confidence: 95.3,
    processingTime: "0.9s",
    modelUsed: "Neonatal-Net v2",
    notes: "Pre-discharge check. Standard clinical assessment normal.",
    riskScore: 8.7,
    heatmapCoords: { x: 50, y: 50, radius: 10 }
  },
  {
    patientId: "NEO-2026-3041",
    name: "Baby Ethan",
    ageDays: 6,
    gender: "Male",
    hospital: "Westside Neonatal Care",
    doctor: "Dr. Elena Smith",
    date: "2026-07-24",
    prediction: "Jaundice Detected",
    status: "High Risk",
    confidence: 89.1,
    processingTime: "1.3s",
    modelUsed: "Neonatal-Net v2",
    notes: "Visual assessment suggests moderate jaundice. Serum bilirubin scheduled. Checking AI screening status.",
    riskScore: 88.2,
    heatmapCoords: { x: 52, y: 48, radius: 55 }
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
