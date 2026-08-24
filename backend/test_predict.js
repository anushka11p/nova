import fs from 'fs';

async function test() {
  const filePath = 'pushpa_Files/neoBloom/datasets/jaundice/jaundice (4).jpg';
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist:", filePath);
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const fileBlob = new Blob([buffer], { type: 'image/jpeg' });
  
  const formData = new FormData();
  formData.append('image', fileBlob, 'jaundice_4.jpg');
  formData.append('name', 'Test Baby');
  formData.append('ageDays', '4');
  formData.append('gender', 'Male');
  formData.append('notes', 'Test jaundice notes');
  
  try {
    const res = await fetch('http://localhost:5001/api/records', {
      method: 'POST',
      body: formData
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
