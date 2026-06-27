/* Build the explainer video: scenes.json -> per-caption frames (Playwright) -> mp4 (ffmpeg).
   Vertical 1080x1920, dark theme, advancing captions, global progress bar. No voiceover (silent track). */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const DIR = __dirname;
const SCENES = JSON.parse(fs.readFileSync(path.join(DIR, 'scenes.json'), 'utf8'));
const FRAMES = path.join(DIR, 'video_frames');
const OUTMP4 = process.argv[2] || path.join(DIR, '缩放定律精读.mp4');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const W = 1080, H = 1920;

fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

// ---- duration model (paced for a calm voiceover dub) ----
const lineDur = (s) => {
  const n = [...s].length;
  return Math.max(1.9, Math.min(5.2, 0.5 + n * 0.15));
};

// flatten into frames
const frames = [];
const total = SCENES.scenes.length;
SCENES.scenes.forEach((sc, si) => {
  const lines = sc.lines.length ? sc.lines : [sc.title];
  lines.forEach((ln, li) => {
    frames.push({ si, sceneNo: si + 1, total, title: sc.title, role: sc.role || '', hero: sc.hero || '',
                  line: ln, prev: li > 0 ? lines[li - 1] : '', dur: lineDur(ln) });
  });
});
const grand = frames.reduce((a, f) => a + f.dur, 0);
frames.forEach((f, i) => { f.progress = (frames.slice(0, i + 1).reduce((a, x) => a + x.dur, 0)) / grand; });

const FRAME_HTML = (f) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;
    background:radial-gradient(120% 80% at 80% 0%,#1a2348 0%,#0b1020 60%,#070a16 100%);color:#fff;position:relative;}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:90px 90px;
    -webkit-mask-image:radial-gradient(100% 60% at 70% 8%,#000,transparent 75%);}
  .progress{position:absolute;top:0;left:0;height:8px;background:linear-gradient(90deg,#6366f1,#22d3ee);width:${(f.progress*100).toFixed(2)}%;
    box-shadow:0 0 18px rgba(99,102,241,.7);}
  .wrap{position:absolute;inset:0;padding:96px 84px 110px;display:flex;flex-direction:column;}
  .top{display:flex;justify-content:space-between;align-items:center;}
  .brand{font-size:32px;font-weight:800;letter-spacing:1px;color:#c7d2fe;}
  .brand .dot{color:#22d3ee;}
  .idx{font-size:30px;font-weight:700;color:#8aa0c8;font-variant-numeric:tabular-nums;letter-spacing:2px;}
  .role{margin-top:70px;display:inline-block;align-self:flex-start;font-size:30px;font-weight:800;color:#0b1020;
    background:linear-gradient(135deg,#a5b4fc,#67e8f9);padding:12px 28px;border-radius:999px;letter-spacing:.5px;}
  .title{font-size:78px;font-weight:900;line-height:1.16;margin-top:30px;letter-spacing:1px;}
  .hero{margin-top:54px;align-self:flex-start;max-width:100%;background:rgba(255,255,255,.04);border:2px solid rgba(125,151,255,.45);
    border-radius:26px;padding:34px 40px;font-size:52px;font-weight:800;line-height:1.3;color:#eaf0ff;
    box-shadow:0 20px 60px rgba(20,30,80,.5),inset 0 0 40px rgba(99,102,241,.12);}
  .hero b{background:linear-gradient(135deg,#a5b4fc,#67e8f9);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .hero sup{font-size:.6em;} .hero sub{font-size:.6em;}
  .capwrap{margin-top:auto;}
  .prev{font-size:34px;color:#7e8db3;line-height:1.4;margin-bottom:16px;min-height:48px;}
  .cap{font-size:56px;font-weight:800;line-height:1.42;color:#fff;
    padding-left:30px;border-left:10px solid;border-image:linear-gradient(#6366f1,#22d3ee) 1;}
  .cap sub{font-size:.62em;} .cap sup{font-size:.62em;}
  .footer{position:absolute;left:84px;bottom:46px;font-size:26px;color:#6b7aa0;font-weight:600;}
  .deco{position:absolute;right:70px;top:45%;opacity:.18;z-index:0;}
</style></head><body>
  <div class="grid"></div>
  <svg class="deco" width="640" height="430" viewBox="0 0 320 215">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
    <path d="M6,18 C70,22 120,70 160,120 C200,168 250,196 314,202" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="314" cy="202" r="6" fill="#22d3ee"/>
  </svg>
  <div class="progress"></div>
  <div class="wrap">
    <div class="top"><div class="brand">缩放定律 <span class="dot">·</span> 精读</div>
      <div class="idx">${String(f.sceneNo).padStart(2,'0')} / ${String(f.total).padStart(2,'0')}</div></div>
    ${f.role ? `<div class="role">${f.role}</div>` : ''}
    <div class="title">${f.title}</div>
    ${f.hero ? `<div class="hero">${f.hero}</div>` : ''}
    <div class="capwrap">
      <div class="prev">${f.prev || ''}</div>
      <div class="cap">${f.line}</div>
    </div>
  </div>
  <div class="footer">原文:Lilian Weng《Scaling Laws, Carefully》</div>
</body></html>`;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (let i = 0; i < frames.length; i++) {
    await page.setContent(FRAME_HTML(frames[i]), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(FRAMES, `f${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();

  // concat list with per-frame durations
  let list = '';
  frames.forEach((f, i) => {
    list += `file 'f${String(i).padStart(4, '0')}.png'\nduration ${f.dur.toFixed(3)}\n`;
  });
  list += `file 'f${String(frames.length - 1).padStart(4, '0')}.png'\n`; // last frame repeated (demuxer quirk)
  fs.writeFileSync(path.join(FRAMES, 'list.txt'), list);

  const fadeOut = Math.max(0, grand - 0.8).toFixed(2);
  const args = [
    '-y',
    '-f', 'concat', '-safe', '0', '-i', 'list.txt',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-vf', `fps=30,format=yuv420p,fade=t=in:st=0:d=0.6,fade=t=out:st=${fadeOut}:d=0.8`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart',
    OUTMP4,
  ];
  execFileSync('ffmpeg', args, { cwd: FRAMES, stdio: 'inherit' });
  console.log('\nDONE:', OUTMP4, '| frames:', frames.length, '| duration(s):', grand.toFixed(1));
})();
