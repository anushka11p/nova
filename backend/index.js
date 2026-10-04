import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Setup middleware
app.use(cors());
app.use(express.json());

// Setup Multer for file uploads
const upload = multer({ dest: path.join(__dirname, 'data/uploads/') });

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'data/uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Paths to database files
const recordsPath = path.join(dataDir, 'records.json');

// Helper to read JSON safely
const readJsonFile = (filePath, fallback = []) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
};

// Helper to write JSON safely
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// --- API ENDPOINTS ---

// 1. Get registry records
app.get('/api/records', (req, res) => {
  const records = readJsonFile(recordsPath, []);
  res.json(records);
});

// 2. Screen a photo and add the record. Every result comes from the image model;
// if the model server is unreachable the request fails rather than guessing.
const imagesDir = path.join(dataDir, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
app.use('/api/images', express.static(imagesDir));

const RISK_LABELS = {
  High: { status: "High Risk", prediction: "Jaundice likely" },
  Moderate: { status: "Moderate Risk", prediction: "Borderline" },
  Normal: { status: "Normal", prediction: "No visible jaundice" }
};

app.post('/api/records', upload.single('image'), async (req, res) => {
  const { name, ageDays, gender, hospital, doctor, notes } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: "A photo of the baby is required." });
  }
  if (!/^image\/(jpeg|png|webp)$/.test(req.file.mimetype)) {
    fs.rmSync(req.file.path, { force: true });
    return res.status(400).json({ error: "Upload a JPEG, PNG or WebP photo." });
  }

  const patientId = /^NEO-\d{4}-\d{4}$/.test(req.body.patientId || '')
    ? req.body.patientId
    : `NEO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let pyData;
  const started = Date.now();
  try {
    const buffer = fs.readFileSync(req.file.path);
    const formDataObj = new FormData();
    formDataObj.append('image', new Blob([buffer], { type: req.file.mimetype }), 'photo');
    const pyResponse = await fetch('http://localhost:8000/predict', { method: 'POST', body: formDataObj });
    if (!pyResponse.ok) throw new Error(`model server responded ${pyResponse.status}`);
    pyData = await pyResponse.json();
  } catch (err) {
    console.error("Screening failed:", err);
    fs.rmSync(req.file.path, { force: true });
    return res.status(503).json({ error: "The screening model is not reachable. Check that the AI server is running, then try again." });
  }
  const elapsedMs = Date.now() - started;

  // Keep the photo with the record so results and reports show what was screened.
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[req.file.mimetype];
  const imageName = `${patientId}-${started}.${ext}`;
  fs.renameSync(req.file.path, path.join(imagesDir, imageName));

  const labels = RISK_LABELS[pyData.risk];
  const now = new Date();
  const newRecord = {
    patientId,
    name: (name || '').trim() || "Unnamed baby",
    ageDays: parseInt(ageDays) || null,
    gender: gender || "Not recorded",
    hospital: hospital || "",
    doctor: doctor || "",
    date: now.toISOString().split('T')[0],
    createdAt: now.toISOString(),
    risk: pyData.risk,
    status: labels.status,
    prediction: labels.prediction,
    probability: pyData.probability,
    threshold: pyData.threshold,
    riskScore: Math.round(pyData.probability * 1000) / 10,
    confidence: pyData.confidence,
    processingTime: `${(elapsedMs / 1000).toFixed(1)}s`,
    modelUsed: pyData.model,
    notes: (notes || '').trim(),
    imageUrl: `/api/images/${imageName}`
  };

  const records = readJsonFile(recordsPath, []);
  records.unshift(newRecord);
  writeJsonFile(recordsPath, records);
  res.status(201).json(newRecord);
});

// Is the image model server reachable?
app.get('/api/health', async (req, res) => {
  try {
    const r = await fetch('http://localhost:8000/', { signal: AbortSignal.timeout(2000) });
    res.json({ model: r.ok ? 'online' : 'offline' });
  } catch {
    res.json({ model: 'offline' });
  }
});

// Measured performance of the deployed model (written by the training scripts).
app.get('/api/model/metrics', (req, res) => {
  const metrics = readJsonFile(path.join(__dirname, '../model_metrics.json'), null);
  if (!metrics) return res.status(404).json({ error: "model_metrics.json not found" });
  res.json(metrics);
});

app.listen(PORT, () => {
  console.log(`Neonatal Jaundice Screening API Server running on port ${PORT}`);
});
