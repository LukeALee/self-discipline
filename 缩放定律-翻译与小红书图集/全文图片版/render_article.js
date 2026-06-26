/* Render the full Chinese translation markdown -> paginated vertical page PNGs.
   Faithful to original content & order. Equations via offline KaTeX. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const MarkdownIt = require('markdown-it');
const texmath = require('markdown-it-texmath');
const katex = require('katex');

const DIR = __dirname;
const SRC = '/home/user/self-discipline/缩放定律-翻译与小红书图集/缩放定律-审慎之道-中文翻译.md';
const RENDER = path.join(DIR, 'render_pages');     // working dir for html+assets
const OUT = process.argv[2] || path.join(DIR, 'article_pages');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

fs.mkdirSync(RENDER, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

// ---- copy katex css + fonts, and figures, next to the html ----
const katexDist = path.join(DIR, 'node_modules', 'katex', 'dist');
fs.copyFileSync(path.join(katexDist, 'katex.min.css'), path.join(RENDER, 'katex.min.css'));
const fontsDst = path.join(RENDER, 'fonts');
fs.mkdirSync(fontsDst, { recursive: true });
for (const f of fs.readdirSync(path.join(katexDist, 'fonts'))) {
  fs.copyFileSync(path.join(katexDist, 'fonts', f), path.join(fontsDst, f));
}
// figures
const figSrc = '/home/user/self-discipline/缩放定律-翻译与小红书图集/figures';
const figDst = path.join(RENDER, 'figures');
fs.mkdirSync(figDst, { recursive: true });
for (const f of fs.readdirSync(figSrc)) fs.copyFileSync(path.join(figSrc, f), path.join(figDst, f));

// ---- markdown -> html ----
let md = fs.readFileSync(SRC, 'utf8');
// strip the leading blockquote meta header lines? keep them — faithful. They are the source-attribution block.
const mdit = new MarkdownIt({ html: true, linkify: false, typographer: false, breaks: false });
mdit.use(texmath, { engine: katex, delimiters: 'dollars', katexOptions: { throwOnError: false, strict: false, trust: true } });
const body = mdit.render(md);

const CSS = `
  :root{--ink:#1c2230;--muted:#5b6472;--accent:#4f46e5;--line:#e6e9f2;--chipbg:#f4f6fc;}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;color:var(--ink);background:#54607a;}
  #measure{position:absolute;left:-99999px;top:0;width:952px;}
  .page{width:1080px;height:1440px;background:#fff;position:relative;overflow:hidden;
        padding:72px 64px 64px;display:flex;flex-direction:column;}
  .page .flow{width:952px;}
  .pagenum{position:absolute;right:64px;bottom:30px;font-size:22px;color:#9aa3b2;font-variant-numeric:tabular-nums;letter-spacing:1px;}
  .brandline{position:absolute;left:64px;bottom:30px;font-size:22px;color:#9aa3b2;font-weight:600;}

  h1{font-size:52px;font-weight:900;line-height:1.25;margin:8px 0 26px;letter-spacing:.5px;}
  h2{font-size:44px;font-weight:800;line-height:1.3;margin:34px 0 20px;padding-left:22px;border-left:10px solid var(--accent);}
  h3{font-size:36px;font-weight:800;line-height:1.3;margin:28px 0 16px;color:#2b3242;}
  p{font-size:30px;line-height:1.62;margin:0 0 22px;}
  ul,ol{font-size:30px;line-height:1.6;margin:0 0 22px;padding-left:42px;}
  li{margin:0 0 12px;}
  strong,b{font-weight:800;}
  a{color:var(--accent);text-decoration:none;border-bottom:2px solid #c9cdf3;}
  code{font-family:"DejaVu Sans Mono",monospace;background:var(--chipbg);padding:2px 8px;border-radius:6px;font-size:.86em;}
  pre{background:#0f1326;color:#e6e9ff;border-radius:16px;padding:24px 28px;font-size:24px;line-height:1.5;overflow:hidden;margin:0 0 22px;}
  pre code{background:none;color:inherit;padding:0;}
  blockquote{margin:0 0 24px;padding:18px 26px;background:var(--chipbg);border-left:8px solid #c9cdf3;border-radius:0 14px 14px 0;
             color:#3a4252;font-size:27px;line-height:1.55;}
  blockquote p{font-size:27px;margin:6px 0;}
  hr{border:none;border-top:2px solid var(--line);margin:30px 0;}
  img{max-width:100%;max-height:760px;object-fit:contain;display:block;margin:8px auto 6px;border:1px solid var(--line);border-radius:14px;}
  em{color:var(--muted);font-style:normal;}
  /* figure caption paragraphs are emphasized lines after an image */
  p > em:only-child{display:block;font-size:25px;color:var(--muted);text-align:center;line-height:1.5;margin-top:0;}
  table{border-collapse:collapse;width:100%;font-size:27px;margin:0 0 24px;}
  th,td{border:1px solid var(--line);padding:14px 18px;text-align:left;vertical-align:top;line-height:1.45;}
  th{background:var(--chipbg);font-weight:800;}
  .katex-display{margin:18px 0;overflow:visible;}
  .katex{font-size:1.04em;}
`;

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<link rel="stylesheet" href="katex.min.css">
<style>${CSS}</style></head>
<body>
<div id="measure"><div class="flow" id="content">${body}</div></div>
<div id="pages"></div>
</body></html>`;

fs.writeFileSync(path.join(RENDER, 'article.html'), html);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(RENDER, 'article.html'), { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });

  const pageCount = await page.evaluate(() => {
    const USABLE = 1440 - 72 - 64;     // content height inside .page padding
    const CONTENT_W = 952;
    const content = document.getElementById('content');

    // auto-fit wide display equations to content width (keep on one line, scale down)
    content.querySelectorAll('.katex-display').forEach(el => {
      const inner = el.querySelector('.katex');
      if (!inner) return;
      const w = inner.scrollWidth;
      if (w > CONTENT_W) {
        const s = CONTENT_W / w;
        inner.style.transformOrigin = 'left center';
        inner.style.transform = `scale(${s})`;
        inner.style.display = 'inline-block';
      }
    });

    const blocks = Array.from(content.children);
    const pagesEl = document.getElementById('pages');
    let pageEl = null, flow = null;
    const newPage = () => {
      pageEl = document.createElement('div'); pageEl.className = 'page';
      flow = document.createElement('div'); flow.className = 'flow';
      pageEl.appendChild(flow); pagesEl.appendChild(pageEl);
    };
    newPage();
    const fits = () => flow.getBoundingClientRect().height <= USABLE;

    for (const b of blocks) {
      const node = b.cloneNode(true);
      flow.appendChild(node);
      if (!fits() && flow.children.length > 1) {
        flow.removeChild(node);   // overflow -> push to next page
        newPage();
        flow.appendChild(node);
        // if a single block alone still overflows, leave it (it gets its own page)
      }
    }
    // page numbers + brand
    const all = Array.from(document.querySelectorAll('.page'));
    all.forEach((p, i) => {
      const n = document.createElement('div'); n.className = 'pagenum';
      n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(all.length).padStart(2, '0');
      p.appendChild(n);
      const br = document.createElement('div'); br.className = 'brandline';
      br.textContent = '缩放定律,审慎之道 · Lilian Weng';
      p.appendChild(br);
    });
    // remove measuring container
    document.getElementById('measure').remove();
    return all.length;
  });

  const pages = await page.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    const file = path.join(OUT, `page-${String(i + 1).padStart(2, '0')}.png`);
    await pages[i].screenshot({ path: file });
  }
  console.log('pages:', pageCount, '-> wrote', pages.length, 'images to', OUT);
  await browser.close();
})();
