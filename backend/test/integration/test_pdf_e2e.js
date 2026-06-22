/**
 * End-to-end test: Actually generate PDF files for Diego and another candidate,
 * then compare file sizes to verify the PDF engine works properly.
 *
 * Run: node test_pdf_e2e.js
 */
const { NestFactory } = require('@nestjs/core');
const fs = require('fs');
const path = require('path');
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const { AppModule } = require(path.join(BACKEND_ROOT, 'dist/src/app.module'));

async function e2eTest() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const { CandidatesService } = require(path.join(BACKEND_ROOT, 'dist/src/candidates/candidates.service'));
  const { PdfService } = require(path.join(BACKEND_ROOT, 'dist/src/pdf/pdf.service'));

  const candidatesService = app.get(CandidatesService);
  const pdfService = app.get(PdfService);

  const candidates = await candidatesService.findAll();
  const diego = candidates.find(c => c.nombres && c.nombres.includes('Diego'));
  const other = candidates.find(c => c.nombres && !c.nombres.includes('Diego'));

  let passed = 0, failed = 0;
  function assert(name, condition) {
    if (condition) { console.log(`  ✅ ${name}`); passed++; }
    else { console.log(`  ❌ ${name}`); failed++; }
  }

  console.log('\n📋 E2E PDF generation test');

  if (diego) {
    try {
      console.log(`  Generating PDF for Diego (${diego.id})...`);
      const { buffer, filename } = await pdfService.generatePdf(diego.id);
      assert('Diego PDF generated successfully', buffer.length > 0);
      assert('Diego PDF filename is valid', filename.includes('Diego'));
      assert('Diego PDF is non-trivial size (>10KB)', buffer.length > 10000);
      console.log(`  ℹ️  Diego PDF: ${filename}, ${(buffer.length / 1024).toFixed(1)} KB`);

      // Save to tmp for manual inspection
      const outPath = path.join(__dirname, `test_output_diego.pdf`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  ℹ️  Saved to: ${outPath}`);
    } catch (err) {
      console.log(`  ❌ Diego PDF generation failed: ${err.message}`);
      failed++;
    }
  }

  if (other) {
    try {
      console.log(`  Generating PDF for ${other.nombres} (${other.id})...`);
      const { buffer, filename } = await pdfService.generatePdf(other.id);
      assert(`${other.nombres} PDF generated successfully`, buffer.length > 0);
      assert(`${other.nombres} PDF is non-trivial size (>10KB)`, buffer.length > 10000);
      console.log(`  ℹ️  ${other.nombres} PDF: ${filename}, ${(buffer.length / 1024).toFixed(1)} KB`);

      const outPath = path.join(__dirname, `test_output_other.pdf`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  ℹ️  Saved to: ${outPath}`);
    } catch (err) {
      console.log(`  ❌ ${other.nombres} PDF generation failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

e2eTest().catch(err => { console.error(err); process.exit(1); });
