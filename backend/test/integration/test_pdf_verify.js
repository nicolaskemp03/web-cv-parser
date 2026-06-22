/**
 * Test: Verify that the PDF HTML generation for Diego produces
 * properly word-wrapping text after the &nbsp; fix.
 *
 * Run: node test_pdf_verify.js
 */
const { NestFactory } = require('@nestjs/core');
const path = require('path');
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const { AppModule } = require(path.join(BACKEND_ROOT, 'dist/src/app.module'));

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const { CandidatesService } = require(path.join(BACKEND_ROOT, 'dist/src/candidates/candidates.service'));
  const { PdfService } = require(path.join(BACKEND_ROOT, 'dist/src/pdf/pdf.service'));
  const Handlebars = require('handlebars');

  const candidatesService = app.get(CandidatesService);
  const pdfService = app.get(PdfService);

  const candidates = await candidatesService.findAll();
  const diego = candidates.find(c => c.nombres && c.nombres.includes('Diego'));
  const other = candidates.find(c => c.nombres && !c.nombres.includes('Diego'));

  if (!diego) {
    console.log('Diego not found');
    process.exit(1);
  }

  let passed = 0, failed = 0;
  function assert(name, condition) {
    if (condition) { console.log(`  ✅ ${name}`); passed++; }
    else { console.log(`  ❌ ${name}`); failed++; }
  }

  // Generate HTML for both candidates using the same pipeline as generatePdf
  const templateRepo = pdfService.templateRepo;
  const template = await templateRepo.findOne({ where: { is_default: true } });
  const hbs = pdfService.convertJinjaToHandlebars(template.html_content);
  pdfService.registerHelpers();
  const compiled = Handlebars.compile(hbs);

  function renderCandidate(c) {
    return compiled({
      bio: {
        nombres: c.nombres, apellidos: c.apellidos,
        rut: c.rut, ubicacion: c.ubicacion, mail: c.mail,
        numero: c.numero, profesion: c.profesion, resumen: c.resumen,
      },
      experiencias: (c.experiences || []).sort((a, b) => a.orden - b.orden),
      formacion: (c.education || []).sort((a, b) => a.orden - b.orden),
      stack_tecnologico: c.stack || [],
      idiomas: c.idiomas || {},
    });
  }

  const diegoHtml = renderCandidate(diego);
  
  console.log('\n📋 PDF HTML verification for Diego (previously broken)');
  assert('No &nbsp; in rendered HTML', !diegoHtml.includes('&nbsp;'));
  assert('Has <strong> tags preserved', diegoHtml.includes('<strong>'));
  assert('Has <br> line breaks', diegoHtml.includes('<br>'));
  assert('Has normal spaces for word-wrap', diegoHtml.includes('de experiencia'));
  assert('Contains his name', diegoHtml.includes('Diego'));
  assert('Contains his profession', diegoHtml.includes('Front-End'));

  if (other) {
    const otherHtml = renderCandidate(other);
    console.log(`\n📋 PDF HTML verification for ${other.nombres} (known-good reference)`);
    assert('No &nbsp; in rendered HTML', !otherHtml.includes('&nbsp;'));
    assert('Has <strong> tags preserved', otherHtml.includes('<strong>'));
    assert('Has <br> line breaks', otherHtml.includes('<br>'));
    assert('Contains their name', otherHtml.includes(other.nombres.split(' ')[0]));
  }

  // Print a sample of Diego's resumen to visually verify
  console.log('\n📄 Diego\'s resumen (first 200 chars):');
  console.log('  ' + diego.resumen.substring(0, 200));

  console.log('\n📄 Diego\'s first experience description (first 200 chars):');
  if (diego.experiences && diego.experiences.length > 0) {
    const first = diego.experiences.sort((a,b) => a.orden - b.orden)[0];
    console.log('  ' + (first.descripcion || '(empty)').substring(0, 200));
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

verify().catch(err => { console.error(err); process.exit(1); });
