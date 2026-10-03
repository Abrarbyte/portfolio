/* Generate the Eval Harness project cover + hover variant, matching the
 * existing /work cards: 1200x1200, #0f1111 ground, lime accents, line art,
 * TikTok Sans title, Geist Mono meta.
 *   node work/_make_evalharness_cover.js
 */
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: ['C:/Abrar project/index_v2_enhanced'] }));

const DIR = __dirname.split('\\').join('/');

const page = (inv) => {
  const ground = inv ? '#c0fe04' : '#0f1111';
  const ink = inv ? '#0f1111' : '#ffffff';
  const stroke = inv ? '#66860a' : '#68880a';
  const accent = inv ? '#0f1111' : '#c0fe04';

  // 4 x 3 task grid inside the container: filled = passing.
  const cells = [];
  const PASS = new Set([0, 1, 2, 3, 4, 5, 6, 8, 9, 11]);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const x = 375 + c * 120;
      const y = 310 + r * 110;
      cells.push(
        `<rect x="${x}" y="${y}" width="90" height="80" rx="4" fill="${
          PASS.has(i) ? accent : 'none'
        }" stroke="${stroke}" stroke-width="6"/>`,
      );
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: 'TikTokSans'; src: url('file:///${DIR}/../fonts/TikTokSans.woff2') format('woff2'); font-weight: 100 900; }
    @font-face { font-family: 'GeistMono'; src: url('file:///${DIR}/../fonts/GeistMono[wght].woff2') format('woff2'); font-weight: 100 900; }
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1200px; height:1200px; }
    body { background:${ground}; position:relative; overflow:hidden; }
    .num { position:absolute; left:80px; top:72px; font-family:'GeistMono',monospace; font-weight:700; font-size:40px; color:${accent}; letter-spacing:1px; }
    svg { position:absolute; left:0; top:0; }
    .title { position:absolute; left:78px; bottom:150px; font-family:'TikTokSans',Helvetica,Arial,sans-serif; font-weight:800; font-size:104px; line-height:0.94; color:${ink}; letter-spacing:-2px; text-transform:uppercase; }
    .meta { position:absolute; left:80px; bottom:78px; font-family:'GeistMono',monospace; font-weight:500; font-size:34px; color:${accent}; letter-spacing:0.5px; }
  </style></head><body>
    <div class="num">09</div>
    <svg width="1200" height="1200" aria-hidden="true">
      <rect x="320" y="250" width="560" height="420" rx="10" fill="none" stroke="${stroke}" stroke-width="6"/>
      ${cells.join('')}
      <path d="M 600 670 L 600 722" stroke="${stroke}" stroke-width="6"/>
      <path d="M 470 722 L 730 722" stroke="${stroke}" stroke-width="6"/>
      <path d="M 500 722 L 500 768" stroke="${stroke}" stroke-width="6"/>
      <path d="M 700 722 L 700 768" stroke="${stroke}" stroke-width="6"/>
      <path d="M 478 778 l 16 18 l 30 -36" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="square"/>
      <path d="M 682 778 l 36 36 M 718 778 l -36 36" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="square"/>
    </svg>
    <div class="title">Eval<br>Harness</div>
    <div class="meta">Python &middot; Docker &middot; pytest &middot; CI</div>
  </body></html>`;
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const [inv, name] of [[false, 'abrar_evalharness.png'], [true, 'abrar_evalharness_h.png']]) {
    const p = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
    await p.setContent(page(inv), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(__dirname, name) });
    console.log(name);
    await p.close();
  }
  await browser.close();
})();
