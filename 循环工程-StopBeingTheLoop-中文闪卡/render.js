/* Generate Xiaohongshu cards HTML from cards.json and screenshot each card to PNG. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const DIR = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'cards.json'), 'utf8'));
const OUT = process.argv[2] || path.join(DIR, 'out');
fs.mkdirSync(OUT, true && { recursive: true });

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const W = 1080, H = 1440, TOTAL = data.cards.length;
const BRAND = (data.meta && data.meta.brand) || 'Scaling Laws 精读';
const COVERBRAND = (data.meta && data.meta.coverBrand) || BRAND;

// ---------- 马卡龙配色(每张卡轮换一个色;deep 用于文字/描边,light 用于渐变,tint 为卡底,chip 为公式条底) ----------
const PALETTE = [
  { a: '#e86a92', a2: '#f4a7c1', tint: '#fff6f9', chip: '#ffe7ef' }, // 草莓
  { a: '#4fa07d', a2: '#98d4b8', tint: '#f3faf6', chip: '#e0f3e9' }, // 抹茶
  { a: '#8a70d6', a2: '#b8a6ec', tint: '#f8f6ff', chip: '#ece5fc' }, // 香芋
  { a: '#ec854a', a2: '#f8bd90', tint: '#fff8f2', chip: '#ffe5d2' }, // 蜜桃
  { a: '#4f94dd', a2: '#96c1ef', tint: '#f3f9ff', chip: '#dfecfb' }, // 海盐蓝
  { a: '#b8901f', a2: '#ecd06a', tint: '#fffdf0', chip: '#f7edc2' }, // 柠檬
  { a: '#b566c3', a2: '#d7a1e0', tint: '#fdf6ff', chip: '#f3e2f8' }, // 葡萄
  { a: '#e2786d', a2: '#f4aaa2', tint: '#fff6f4', chip: '#ffe4df' }, // 珊瑚
];
const themeStyle = (idx) => {
  const t = PALETTE[idx % PALETTE.length];
  return `--accent:${t.a};--accent2:${t.a2};--tint:${t.tint};--chipbg:${t.chip}`;
};

// ---------- decorative SVG: descending power-law curve on a faint log-log grid ----------
function powerCurve(stroke, opacity) {
  // a smooth y = x^-k style curve
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const y = Math.pow(0.06 + x * 0.94, -0.42); // descending
    pts.push([x, y]);
  }
  const minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
  const w = 300, h = 200;
  const d = pts.map(([x, y], i) => {
    const px = (x * w).toFixed(1);
    const py = (h - ((y - minY) / (maxY - minY)) * h).toFixed(1);
    return (i === 0 ? 'M' : 'L') + px + ',' + py;
  }).join(' ');
  return `<svg class="deco" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="opacity:${opacity}">
    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="0" cy="${(h - 0).toFixed(1)}" r="0"/>
  </svg>`;
}

function symbolsHTML(syms) {
  if (!syms) return '';
  return `<div class="symbols">` + syms.map(([k, v]) =>
    `<div class="sym"><span class="sym-k">${k}</span><span class="sym-v">${v}</span></div>`).join('') + `</div>`;
}

function pointsHTML(points) {
  if (!points) return '';
  return `<ul class="points">` + points.map(p => `<li>${p}</li>`).join('') + `</ul>`;
}

function formulaHTML(f) {
  if (!f) return '';
  return `<div class="formula">${f}</div>`;
}

function cardHTML(c, idx) {
  const page = String(idx + 1).padStart(2, '0');
  const progress = ((idx + 1) / TOTAL * 100).toFixed(1);

  if (c.type === 'cover') {
    return `<section class="card cover">
      <div class="grid-bg"></div>
      ${powerCurve('rgba(130,108,178,0.45)', 0.9)}
      <div class="cover-inner">
        <div class="cover-kicker">${c.kicker}</div>
        <h1 class="cover-title">${c.title}</h1>
        <div class="cover-en">${c.titleEn}</div>
        <div class="cover-hook">${c.hook}</div>
      </div>
      <div class="cover-footer">${c.footer}</div>
      <div class="cover-brand">${COVERBRAND}</div>
    </section>`;
  }

  if (c.type === 'end') {
    return `<section class="card end" style="${themeStyle(idx)}">
      <div class="grid-bg"></div>
      <div class="head">
        <div class="tag tag-end">${c.tag}</div>
        <div class="brand">${BRAND}</div>
      </div>
      <h2 class="title">${c.title}</h2>
      ${pointsHTML(c.points)}
      <div class="cta">${c.cta}</div>
      <div class="end-foot">${c.footer}</div>
      <div class="foot">
        <div class="page">${page} / ${TOTAL}</div>
        <div class="bar"><span style="width:${progress}%"></span></div>
      </div>
    </section>`;
  }

  return `<section class="card content" style="${themeStyle(idx)}">
    <div class="grid-bg"></div>
    ${powerCurve('var(--accent)', 0.14)}
    <div class="head">
      <div class="tag"><span class="tag-num">${c.tagNum}</span>${c.tag}</div>
      <div class="brand">${BRAND}</div>
    </div>
    <h2 class="title">${c.title}</h2>
    ${c.subtitle ? `<div class="subtitle">${c.subtitle}</div>` : ''}
    ${pointsHTML(c.points)}
    ${symbolsHTML(c.symbols)}
    ${formulaHTML(c.formula)}
    <div class="foot">
      <div class="page">${page} / ${TOTAL}</div>
      <div class="bar"><span style="width:${progress}%"></span></div>
    </div>
  </section>`;
}

const CSS = `
  :root{
    --accent:#e86a92; --accent2:#f4a7c1; --tint:#fff6f9; --chipbg:#ffe7ef;
    --ink:#3b3646; --muted:#a99fb8; --line:#efeaf3;
  }
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  body{font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;color:var(--ink);background:#4a4560;}
  .card{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--tint);}
  .grid-bg{position:absolute;inset:0;
    background-image:linear-gradient(rgba(120,105,150,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(120,105,150,.06) 1px,transparent 1px);
    background-size:72px 72px;opacity:1;
    -webkit-mask-image:radial-gradient(120% 90% at 80% 10%,#000 0%,transparent 70%);
            mask-image:radial-gradient(120% 90% at 80% 10%,#000 0%,transparent 70%);}
  .deco{position:absolute;right:60px;bottom:150px;z-index:0;}

  /* ---------- content ---------- */
  .content{padding:84px 84px 72px;display:flex;flex-direction:column;}
  .head{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;}
  .tag{display:inline-flex;align-items:center;gap:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;
    font-size:30px;font-weight:800;padding:14px 26px 14px 18px;border-radius:999px;letter-spacing:.5px;
    box-shadow:0 10px 22px rgba(150,120,150,.22);}
  .tag-num{background:rgba(255,255,255,.30);border-radius:999px;padding:4px 14px;font-size:26px;}
  .brand{font-size:26px;color:var(--muted);font-weight:700;letter-spacing:.5px;}
  .title{position:relative;z-index:2;font-size:74px;font-weight:900;line-height:1.18;margin-top:54px;letter-spacing:1px;color:#3b3646;}
  .subtitle{position:relative;z-index:2;font-size:36px;color:var(--accent);font-weight:800;margin-top:22px;}
  .points{position:relative;z-index:2;list-style:none;margin-top:54px;display:flex;flex-direction:column;gap:34px;}
  .points li{position:relative;font-size:39px;line-height:1.55;color:#4b4653;padding-left:50px;font-weight:500;}
  .points li::before{content:"";position:absolute;left:0;top:18px;width:24px;height:24px;border-radius:8px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 4px 10px rgba(150,120,150,.25);}
  .points li b{font-weight:900;color:var(--accent);}
  .symbols{position:relative;z-index:2;margin-top:46px;display:grid;grid-template-columns:1fr 1fr;gap:20px 28px;}
  .sym{display:flex;align-items:center;gap:20px;background:var(--chipbg);border:1px solid rgba(0,0,0,.04);
    border-radius:18px;padding:20px 26px;}
  .sym-k{font-family:"Noto Serif CJK SC",serif;font-style:italic;font-size:42px;font-weight:700;color:var(--accent);min-width:54px;}
  .sym-v{font-size:32px;color:#4b4653;font-weight:600;}
  .formula{position:relative;z-index:2;margin-top:auto;margin-bottom:18px;background:var(--chipbg);
    color:#453f4d;font-size:37px;font-weight:700;padding:30px 38px;border-radius:22px;line-height:1.4;
    border:2.5px solid var(--accent);box-shadow:0 16px 34px rgba(150,130,160,.2);}
  .formula sup{font-size:.62em;}.formula sub{font-size:.62em;}
  .points sup,.points sub{font-size:.62em;}

  .foot{position:relative;z-index:2;margin-top:40px;display:flex;align-items:center;gap:28px;}
  .page{font-size:28px;color:var(--muted);font-weight:800;letter-spacing:2px;font-variant-numeric:tabular-nums;}
  .bar{flex:1;height:10px;background:rgba(120,105,150,.14);border-radius:999px;overflow:hidden;}
  .bar span{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;}

  /* ---------- cover ---------- */
  .cover{background:linear-gradient(150deg,#ffd9e6 0%,#e7d8f7 44%,#c9edde 100%);color:#4a4270;
    padding:96px 84px;display:flex;flex-direction:column;}
  .cover .grid-bg{background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);
    background-size:80px 80px;opacity:.5;
    -webkit-mask-image:radial-gradient(120% 80% at 20% 100%,#000,transparent 70%);mask-image:radial-gradient(120% 80% at 20% 100%,#000,transparent 70%);}
  .cover .deco{right:40px;bottom:300px;}
  .cover-inner{position:relative;z-index:2;margin-top:40px;}
  .cover-kicker{display:inline-block;font-size:30px;font-weight:800;background:rgba(255,255,255,.62);color:#6d5f9c;
    padding:14px 28px;border-radius:999px;letter-spacing:1px;box-shadow:0 8px 20px rgba(150,130,180,.2);}
  .cover-title{font-size:130px;font-weight:900;line-height:1.05;margin-top:48px;letter-spacing:4px;color:#493f6e;
    text-shadow:0 10px 34px rgba(140,115,175,.22);}
  .cover-en{font-size:46px;font-weight:800;color:#7a6cab;margin-top:24px;letter-spacing:2px;font-style:italic;}
  .cover-hook{font-size:50px;font-weight:800;line-height:1.4;margin-top:64px;color:#4c4759;
    border-left:10px solid #e86a92;padding-left:34px;}
  .cover-footer{position:relative;z-index:2;margin-top:auto;font-size:36px;font-weight:800;color:#6f6690;}
  .cover-brand{position:relative;z-index:2;margin-top:24px;font-size:28px;color:#8a80a6;font-weight:700;letter-spacing:1px;}

  /* ---------- end ---------- */
  .end{padding:84px 84px 72px;display:flex;flex-direction:column;
    background:linear-gradient(160deg,#fff6fb 0%,var(--tint) 55%,#f2ecfb 100%);}
  .tag-end{background:linear-gradient(135deg,var(--accent),var(--accent2));}
  .end .title{margin-top:50px;}
  .end .points{margin-top:48px;gap:36px;}
  .end .points li{font-size:41px;}
  .cta{position:relative;z-index:2;margin-top:52px;background:#fff;border:2.5px dashed var(--accent);
    color:var(--accent);font-size:34px;font-weight:800;text-align:center;padding:30px;border-radius:22px;
    box-shadow:0 14px 30px rgba(150,130,160,.16);}
  .end-foot{position:relative;z-index:2;margin-top:36px;font-size:30px;color:var(--muted);font-weight:600;line-height:1.5;text-align:center;}
`;

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${CSS}</style></head>
<body>${data.cards.map(cardHTML).join('\n')}</body></html>`;

fs.writeFileSync(path.join(DIR, 'cards.html'), html);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const cards = await page.$$('.card');
  const names = data.cards.map((c, i) => {
    const n = String(i + 1).padStart(2, '0');
    return `${n}-${c.type}`;
  });
  for (let i = 0; i < cards.length; i++) {
    const file = path.join(OUT, `${names[i]}.png`);
    await cards[i].screenshot({ path: file });
    console.log('wrote', file);
  }
  await browser.close();
})();
