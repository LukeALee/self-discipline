/* Mini Apple-Notes style flashcards: notes.json -> 1080x1440 PNGs. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const DIR = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'notes.json'), 'utf8'));
const OUT = process.argv[2] || path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const W = 1080, H = 1440, TOTAL = data.cards.length;

const check = `<span class="ck"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 12.6l4.2 4.2L19 7.2" fill="none" stroke="#fff" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
const topTools = `<span class="tools">
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c9c2b0" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><rect x="5" y="12" width="14" height="8" rx="2"/></svg>
  <svg width="34" height="34" viewBox="0 0 24 24" fill="#c9c2b0"><circle cx="5" cy="12" r="2.1"/><circle cx="12" cy="12" r="2.1"/><circle cx="19" cy="12" r="2.1"/></svg>
</span>`;

function itemsHTML(items) {
  if (!items || !items.length) return '';
  return `<ul class="items">` + items.map(t => `<li>${check}<span class="tx">${t}</span></li>`).join('') + `</ul>`;
}

function cardHTML(c, idx) {
  const page = `${idx + 1} / ${TOTAL}`;
  const back = c.back || data.meta.folder;
  if (c.type === 'cover') {
    return `<section class="card"><div class="note cover">
      <div class="top"><span class="back"><span class="chev">‹</span> ${back}</span>${topTools}</div>
      <div class="paper">
        <h1 class="c-title">${c.title}</h1>
        <div class="c-sub">${c.subtitle}</div>
        <div class="c-auth">${c.author}</div>
        ${c.hl ? `<div class="hl">${c.hl}</div>` : ''}
        <ul class="dl">${(c.footItems || []).map(t => `<li>${check}<span class="tx">${t}</span></li>`).join('')}</ul>
      </div>
      <div class="foot"><span class="date">${c.date || ''}</span><span class="pg">${page}</span></div>
    </div></section>`;
  }
  const isEnd = c.type === 'end';
  return `<section class="card"><div class="note">
    <div class="top"><span class="back"><span class="chev">‹</span> ${back}</span>${topTools}</div>
    <div class="paper">
      <div class="kicker">${c.kicker || ''}</div>
      <h2 class="title">${c.title}</h2>
      ${c.date ? `<div class="meta">${c.date}</div>` : ''}
      ${itemsHTML(c.items)}
      ${c.hl ? `<div class="hl">${c.hl}</div>` : ''}
      ${c.foot ? `<div class="src">${c.foot}</div>` : ''}
    </div>
    <div class="foot"><span class="date">${isEnd ? '' : ''}</span><span class="pg">${page}</span></div>
  </div></section>`;
}

const CSS = `
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  :root{--paper:#fcfaf1;--ink:#1f1e1b;--body:#33322d;--muted:#a7a08d;--rule:#efe8d4;
        --yellow:#f6b800;--yellow2:#ffcf33;--chev:#f2a900;}
  body{font-family:"Noto Sans CJK SC","Noto Sans","Helvetica Neue",Arial,sans-serif;
       background:#e7e3da;color:var(--body);}
  .card{width:${W}px;height:${H}px;position:relative;
        background:radial-gradient(120% 100% at 50% 0%,#eeeae1 0%,#e2ded4 100%);
        display:flex;align-items:center;justify-content:center;}
  .note{width:992px;height:1342px;background:var(--paper);border-radius:46px;position:relative;overflow:hidden;
        box-shadow:0 34px 70px rgba(70,58,30,.20),0 4px 12px rgba(70,58,30,.10);
        display:flex;flex-direction:column;padding:52px 60px 40px;}
  /* faint ruled paper behind the body */
  .paper{position:relative;flex:1;display:flex;flex-direction:column;margin-top:8px;
         background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 71px,var(--rule) 71px,var(--rule) 73px);
         background-position:0 118px;}
  .top{display:flex;align-items:center;justify-content:space-between;}
  .back{font-size:31px;font-weight:600;color:var(--chev);letter-spacing:.3px;display:flex;align-items:center;gap:8px;}
  .chev{font-size:44px;font-weight:700;line-height:.7;margin-top:-4px;}
  .tools{display:flex;gap:22px;align-items:center;}

  .kicker{font-size:29px;font-weight:800;color:var(--yellow);letter-spacing:1.5px;margin-top:22px;}
  .title{font-size:66px;font-weight:800;color:var(--ink);line-height:1.2;margin-top:12px;letter-spacing:.5px;}
  .meta{font-size:27px;color:var(--muted);font-weight:500;margin-top:14px;}
  .items{list-style:none;margin-top:40px;display:flex;flex-direction:column;gap:30px;}
  .items li{display:flex;gap:24px;align-items:flex-start;}
  .ck{flex:0 0 auto;width:46px;height:46px;border-radius:50%;margin-top:4px;
      background:linear-gradient(150deg,var(--yellow2),var(--yellow));display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 10px rgba(230,170,0,.35);}
  .tx{font-size:36px;line-height:1.5;color:var(--body);font-weight:500;}
  .tx b{font-weight:800;color:var(--ink);}
  .hl{margin-top:38px;align-self:flex-start;font-size:34px;font-weight:700;color:#5a4a12;line-height:1.5;
      background:linear-gradient(180deg,rgba(255,214,10,.0) 34%,rgba(255,214,10,.42) 34%);
      padding:2px 6px 4px;border-radius:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone;}
  .src{margin-top:auto;font-size:25px;color:var(--muted);font-weight:500;line-height:1.5;padding-top:26px;}

  .foot{display:flex;align-items:center;justify-content:space-between;padding-top:16px;}
  .foot .date{font-size:25px;color:var(--muted);font-weight:500;}
  .foot .pg{font-size:25px;color:var(--muted);font-weight:700;letter-spacing:1px;font-variant-numeric:tabular-nums;margin-left:auto;}

  /* cover */
  .cover .paper{background-image:none;margin-top:20px;}
  .c-title{font-size:104px;font-weight:800;color:var(--ink);line-height:1.1;letter-spacing:1px;margin-top:26px;}
  .c-sub{font-size:38px;font-style:italic;color:#8a8272;font-weight:600;margin-top:26px;letter-spacing:.5px;}
  .c-auth{font-size:30px;color:var(--muted);font-weight:600;margin-top:18px;}
  .cover .hl{margin-top:54px;font-size:40px;line-height:1.45;}
  .dl{list-style:none;margin-top:auto;display:flex;flex-direction:column;gap:22px;}
  .dl li{display:flex;gap:22px;align-items:center;}
  .dl .tx{font-size:31px;color:#6f6857;font-weight:600;}
`;

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${CSS}</style></head>
<body>${data.cards.map(cardHTML).join('\n')}</body></html>`;
fs.writeFileSync(path.join(DIR, 'notes.html'), html);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const cards = await page.$$('.card');
  for (let i = 0; i < cards.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    await cards[i].screenshot({ path: path.join(OUT, `${n}-${data.cards[i].type}.png`) });
    console.log('wrote', n);
  }
  await browser.close();
})();
