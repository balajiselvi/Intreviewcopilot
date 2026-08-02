const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfFolder = path.join(__dirname, 'grc_pdfs');
const txtFolder = path.join(__dirname, 'grc_docs');

if (!fs.existsSync(txtFolder)) {
  fs.mkdirSync(txtFolder);
}

async function convertAllPdfs() {
  if (!fs.existsSync(pdfFolder)) {
    console.log("⚠️ Folder 'grc_pdfs' missing! Please create it and add your PDFs.");
    return;
  }

  const files = fs.readdirSync(pdfFolder);

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const pdfPath = path.join(pdfFolder, file);
      const txtName = file.replace(/\.pdf$/i, '.txt');
      const txtPath = path.join(txtFolder, txtName);

      try {
        console.log(`Converting: ${file} -> ${txtName}`);
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        fs.writeFileSync(txtPath, data.text, 'utf-8');
      } catch (err) {
        console.error(`❌ Error converting ${file}:`, err.message);
      }
    }
  }

  console.log("\n🎉 Done! All PDFs successfully converted into text inside 'grc_docs/'");
}

convertAllPdfs();