const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173');

  // Wait for the Dashboard to load and fetch data
  await new Promise(r => setTimeout(r, 3000));

  console.log('Clicking edit button...');
  // Find the edit button (it has an Edit2 icon or title="Editar Datos")
  const editButton = await page.$('button[title="Editar Datos"]');
  if (editButton) {
    await editButton.click();
    console.log('Clicked edit button. Waiting to see if it crashes...');
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('Edit button not found. Candidates list might be empty.');
  }

  await browser.close();
})();
