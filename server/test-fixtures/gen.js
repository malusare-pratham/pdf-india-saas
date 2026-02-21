const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun } = require('docx');
(async () => {
  const out = process.argv[2];
  const pdf1 = await PDFDocument.create();
  const f = await pdf1.embedFont(StandardFonts.Helvetica);
  let p = pdf1.addPage([595,842]);
  p.drawText('Sample PDF 1 - Page 1', { x: 50, y: 780, size: 18, font: f });
  p = pdf1.addPage([595,842]);
  p.drawText('Sample PDF 1 - Page 2', { x: 50, y: 780, size: 18, font: f });
  fs.writeFileSync(path.join(out,'sample1.pdf'), await pdf1.save());
  const pdf2 = await PDFDocument.create();
  const f2 = await pdf2.embedFont(StandardFonts.Helvetica);
  const p2 = pdf2.addPage([595,842]);
  p2.drawText('Sample PDF 2 - Single Page', { x: 50, y: 780, size: 18, font: f2 });
  fs.writeFileSync(path.join(out,'sample2.pdf'), await pdf2.save());
  const doc = new Document({ sections: [{ children: [
    new Paragraph({ children:[new TextRun('Sample DOCX file')]}),
    new Paragraph({ children:[new TextRun('Generated for API smoke test')]}),
  ]}]});
  fs.writeFileSync(path.join(out,'sample.docx'), await Packer.toBuffer(doc));
})();
