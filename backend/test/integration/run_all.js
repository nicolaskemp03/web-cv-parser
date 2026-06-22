#!/usr/bin/env node
/**
 * Run all integration tests.
 * Usage: node test/integration/run_all.js
 */
const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'test_sanitizer.js',
  'test_pdf_verify.js',
  'test_pdf_e2e.js',
];

const dir = path.join(__dirname);
let allPassed = true;

console.log('╔══════════════════════════════════════════╗');
console.log('║    Konexa CV — Integration Test Suite    ║');
console.log('╚══════════════════════════════════════════╝\n');

for (const test of tests) {
  const testPath = path.join(dir, test);
  console.log(`▶ Running ${test}...`);
  try {
    execSync(`node ${testPath}`, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  } catch (err) {
    allPassed = false;
    console.log(`\n⛔ ${test} FAILED\n`);
  }
}

console.log('\n' + '═'.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
} else {
  console.log('❌ SOME TESTS FAILED');
}
console.log('═'.repeat(50) + '\n');

process.exit(allPassed ? 0 : 1);
