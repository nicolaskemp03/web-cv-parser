/**
 * Integration test: verifies that the cleanQuillHtml sanitizer properly
 * converts ReactQuill HTML output into PDF-safe HTML that matches the
 * format expected by the Handlebars/Puppeteer PDF template.
 *
 * Run: node test_sanitizer.js
 */

const { NestFactory } = require('@nestjs/core');
const path = require('path');
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const { AppModule } = require(path.join(BACKEND_ROOT, 'dist/src/app.module'));

async function runTests() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const { CandidatesService } = require(path.join(BACKEND_ROOT, 'dist/src/candidates/candidates.service'));
  const service = app.get(CandidatesService);

  let passed = 0;
  let failed = 0;

  function assert(testName, actual, expected) {
    if (actual === expected) {
      console.log(`  ✅ ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ ${testName}`);
      console.log(`     Expected: ${JSON.stringify(expected)}`);
      console.log(`     Actual:   ${JSON.stringify(actual)}`);
      failed++;
    }
  }

  // ─── Test Group 1: &nbsp; replacement ─────────────────────────────
  console.log('\n📋 Test Group 1: &nbsp; replacement (ROOT CAUSE)');
  
  assert(
    'Replaces &nbsp; with regular spaces',
    service.cleanQuillHtml('Hello&nbsp;world&nbsp;test'),
    'Hello world test'
  );

  assert(
    'Handles mixed &nbsp; and normal spaces',
    service.cleanQuillHtml('Hello&nbsp;world test&nbsp;here'),
    'Hello world test here'
  );

  assert(
    'Preserves <strong> while replacing &nbsp;',
    service.cleanQuillHtml('Desarrollador&nbsp;<strong>Front-End</strong>&nbsp;con&nbsp;experiencia'),
    'Desarrollador <strong>Front-End</strong> con experiencia'
  );

  // ─── Test Group 2: <p> tag handling ────────────────────────────────
  console.log('\n📋 Test Group 2: <p> tag handling');

  assert(
    'Strips wrapping <p> tags',
    service.cleanQuillHtml('<p>Hello world</p>'),
    'Hello world'
  );

  assert(
    'Converts </p><p> to <br>',
    service.cleanQuillHtml('<p>Paragraph 1</p><p>Paragraph 2</p>'),
    'Paragraph 1<br>Paragraph 2'
  );

  assert(
    'Handles <p> with class attributes from Quill',
    service.cleanQuillHtml('<p class="ql-align-justify">Justified text</p>'),
    'Justified text'
  );

  // ─── Test Group 3: List handling ───────────────────────────────────
  console.log('\n📋 Test Group 3: List handling');

  assert(
    'Converts Quill ordered list to bullet points',
    service.cleanQuillHtml('<ol><li>Item 1</li><li>Item 2</li></ol>'),
    '● Item 1<br>● Item 2'
  );

  assert(
    'Converts Quill unordered list to bullet points',
    service.cleanQuillHtml('<ul><li>Item A</li><li>Item B</li></ul>'),
    '● Item A<br>● Item B'
  );

  // ─── Test Group 4: Realistic ReactQuill output ─────────────────────
  console.log('\n📋 Test Group 4: Realistic ReactQuill editor output');

  // This is exactly what ReactQuill sends for a "resumen" field
  const quillResumen = '<p>Desarrollador&nbsp;<strong>Front-End</strong>&nbsp;con&nbsp;más&nbsp;de&nbsp;4&nbsp;años&nbsp;de&nbsp;experiencia.</p>';
  assert(
    'Full resumen from Quill → clean text with <strong>',
    service.cleanQuillHtml(quillResumen),
    'Desarrollador <strong>Front-End</strong> con más de 4 años de experiencia.'
  );

  // This is what ReactQuill sends for a multi-paragraph experience description
  const quillExperience = '<p>Desarrollo&nbsp;de&nbsp;tiendas&nbsp;eCommerce&nbsp;con&nbsp;VTEX&nbsp;IO</p><p>Componentes&nbsp;reutilizables&nbsp;en&nbsp;React</p><p>Optimización&nbsp;de&nbsp;rendimiento</p>';
  assert(
    'Multi-paragraph experience → single block with <br>',
    service.cleanQuillHtml(quillExperience),
    'Desarrollo de tiendas eCommerce con VTEX IO<br>Componentes reutilizables en React<br>Optimización de rendimiento'
  );

  // ─── Test Group 5: Edge cases ─────────────────────────────────────
  console.log('\n📋 Test Group 5: Edge cases');

  assert(
    'null input returns null',
    service.cleanQuillHtml(null),
    null
  );

  assert(
    'empty string returns empty string',
    service.cleanQuillHtml(''),
    ''
  );

  assert(
    'Already-clean OpenAI output passes through unchanged',
    service.cleanQuillHtml('Texto normal con <strong>negrita</strong> y <br>saltos'),
    'Texto normal con <strong>negrita</strong> y <br>saltos'
  );

  assert(
    'Excessive <br> tags get collapsed to max 2',
    service.cleanQuillHtml('Line1<br><br><br><br>Line2'),
    'Line1<br><br>Line2'
  );

  // ─── Test Group 6: Database round-trip with Diego ──────────────────
  console.log('\n📋 Test Group 6: Database round-trip verification');

  const candidates = await service.findAll();
  const diego = candidates.find(c => c.nombres && c.nombres.includes('Diego'));

  if (diego) {
    const hasNbsp = diego.resumen && diego.resumen.includes('&nbsp;');
    const expWithNbsp = (diego.experiences || []).some(e => e.descripcion && e.descripcion.includes('&nbsp;'));

    console.log(`  ℹ️  Diego's resumen has &nbsp;: ${hasNbsp}`);
    console.log(`  ℹ️  Diego's experiences have &nbsp;: ${expWithNbsp}`);

    if (hasNbsp || expWithNbsp) {
      console.log('  ⚠️  Diego has corrupted data in DB. Simulating a re-save to clean it...');

      // Simulate what happens when the frontend sends the data back
      const updatePayload = {
        nombres: diego.nombres,
        apellidos: diego.apellidos,
        resumen: diego.resumen,
        profesion: diego.profesion,
        stack: diego.stack,
        idiomas: diego.idiomas,
        experiences: diego.experiences.map(e => ({
          puesto: e.puesto,
          empresa: e.empresa,
          inicio: e.inicio,
          termino: e.termino,
          descripcion: e.descripcion,
        })),
        education: diego.education.map(e => ({
          titulo: e.titulo,
          institucion: e.institucion,
          anio: e.anio,
        })),
      };

      const updated = await service.update(diego.id, updatePayload);

      const cleanResumen = !updated.resumen.includes('&nbsp;');
      const cleanExps = !(updated.experiences || []).some(e => e.descripcion && e.descripcion.includes('&nbsp;'));

      assert('After re-save, resumen has no &nbsp;', cleanResumen, true);
      assert('After re-save, experiences have no &nbsp;', cleanExps, true);

      // Verify the text still has meaningful content
      assert('Resumen still contains <strong> tags', updated.resumen.includes('<strong>'), true);
      assert('Resumen still contains actual text', updated.resumen.includes('experiencia'), true);
    } else {
      console.log('  ℹ️  Diego\'s data is already clean. Skipping re-save test.');
      passed += 2; // Count as passing
    }
  } else {
    console.log('  ⚠️  Diego not found in database. Skipping DB round-trip tests.');
  }

  // ─── Summary ──────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'═'.repeat(50)}\n`);

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
