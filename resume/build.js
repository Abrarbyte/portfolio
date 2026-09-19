/* Render resume/*.html to PDF with Chrome, which keeps every <a href> as a clickable link.
 *   node resume/build.js
 * Outputs to the site root so they are served at /<name>.pdf.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(require.resolve('playwright', { paths: [path.join(__dirname, '..', '..')] }));

const ROOT = path.join(__dirname, '..');
const JOBS = [
  ['backend.html', 'Abrar_Patel_Backend_Developer.pdf'],
  ['ai.html', 'Abrar_Patel_AI_Engineer.pdf'],
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  for (const [src, out] of JOBS) {
    await page.goto('file:///' + path.join(__dirname, src).replace(/\\/g, '/'), { waitUntil: 'load' });
    const pdf = path.join(ROOT, out);
    await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
    const bytes = fs.statSync(pdf).size;
    // page count: count /Type /Page objects (excluding /Pages)
    const pages = (fs.readFileSync(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`${out.padEnd(36)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${pages} page${pages === 1 ? '' : 's'}`);
  }
  await browser.close();
})();
