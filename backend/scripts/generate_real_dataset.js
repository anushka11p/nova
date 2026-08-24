import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '../..');
const datasetsDir = path.join(projectRoot, 'pushpa_Files/neoBloom/datasets');
const dataDir = path.join(projectRoot, 'backend/data');

const jaundiceDir = path.join(datasetsDir, 'jaundice');
const normalDir = path.join(datasetsDir, 'normal');

const datasetJsonPath = path.join(dataDir, 'dataset.json');
const datasetCsvPath = path.join(dataDir, 'sample_dataset.csv');

// Helper for random choices
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

const generateDataset = () => {
  const records = [];
  let idCounter = 1001;

  if (!fs.existsSync(jaundiceDir) || !fs.existsSync(normalDir)) {
    console.error("Error: Datasets directories not found.");
    process.exit(1);
  }

  // Process Jaundice files (High Risk)
  const jaundiceFiles = fs.readdirSync(jaundiceDir).filter(f => f.toLowerCase().endsWith('.jpg'));
  jaundiceFiles.forEach(file => {
    records.push({
      patientId: `NEO-IMG-${idCounter++}`,
      name: `Infant J-${file.split('(')[1]?.split(')')[0] || idCounter}`,
      ageDays: randomChoice([1, 2, 3, 4, 5, 6, 7, 8]),
      gender: randomChoice(["Male", "Female"]),
      notes: `Validated clinical training image: pushpa_Files/neoBloom/datasets/jaundice/${file}`,
      status: "High Risk",
      riskScore: randomRange(75.0, 99.5)
    });
  });

  // Process Normal files (Normal)
  const normalFiles = fs.readdirSync(normalDir).filter(f => f.toLowerCase().endsWith('.jpg'));
  normalFiles.forEach(file => {
    records.push({
      patientId: `NEO-IMG-${idCounter++}`,
      name: `Infant N-${file.split('(')[1]?.split(')')[0] || idCounter}`,
      ageDays: randomChoice([1, 2, 3, 4, 5, 6, 7, 8]),
      gender: randomChoice(["Male", "Female"]),
      notes: `Validated clinical training image: pushpa_Files/neoBloom/datasets/normal/${file}`,
      status: "Normal",
      riskScore: randomRange(5.0, 30.0)
    });
  });

  // Write JSON
  fs.writeFileSync(datasetJsonPath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`Saved ${records.length} JSON records to ${datasetJsonPath}`);

  // Write CSV
  const csvHeaders = "patientId,name,ageDays,gender,notes,status,riskScore\n";
  const csvRows = records.map(r => 
    `"${r.patientId}","${r.name}",${r.ageDays},"${r.gender}","${r.notes}","${r.status}",${r.riskScore}`
  ).join('\n');
  fs.writeFileSync(datasetCsvPath, csvHeaders + csvRows, 'utf8');
  console.log(`Saved CSV file to ${datasetCsvPath}`);
};

generateDataset();
