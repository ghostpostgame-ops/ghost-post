// Язык
const root = document.documentElement;
function setLang(l) { root.dataset.lang = l; root.lang = l; }
let saved = null;
try { saved = localStorage.getItem('lang'); } catch (e) {}
setLang(saved === 'ru' || saved === 'en' ? saved : /^(ru|uk|be|kk)/.test(navigator.language) ? 'ru' : 'en');
document.getElementById('lang').onclick = () => {
  setLang(root.dataset.lang === 'ru' ? 'en' : 'ru');
  try { localStorage.setItem('lang', root.dataset.lang); } catch (e) {}
};

// Ночной город: призрак летит к окну, на которое нажали, и оно загорается
const cv = document.getElementById('town'), g = cv.getContext('2d'), P = 4;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const img = new Image(); img.src = 'img/icon_fg_432.png';
let W, H, stars, houses, wins, lamps, ghost = null, queue = [], lit = new Set(), seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function build() {
  W = cv.width = Math.ceil(cv.clientWidth / P); H = cv.height = Math.ceil(cv.clientHeight / P);
  seed = 7; stars = []; houses = []; wins = []; lamps = []; queue = []; lit.clear();
  for (let i = 0; i < W / 3; i++) stars.push([rnd() * W | 0, rnd() * H * .55 | 0, rnd() * 6]);
  const ground = H - 18;
  for (let x = 4; x < W - 20;) {
    const w = 24 + (rnd() * 3 | 0) * 8, h = Math.min(26 + (rnd() * 4 | 0) * 8, H * .4 | 0);
    if (x + w > W - 2) break;
    houses.push([x, ground - h, w, h]);
    for (let wy = ground - h + 6; wy < ground - 10; wy += 12)
      for (let wx = x + 4; wx < x + w - 7; wx += 9)
        if (rnd() < .6) wins.push({ x: wx, y: wy });
    x += w;
    if (rnd() < .55) { lamps.push(x + 5); x += 12; } else x += 3;
  }
  if (!ghost) ghost = { x: W / 2, y: H * .45 };
  ghost.x = Math.min(ghost.x, W - 10); count();
}
const count = () => document.querySelectorAll('.n').forEach(e => e.textContent = lit.size);
function glow(x, y, r) {
  for (const [k, a] of [[1, .07], [.65, .09], [.35, .12]]) {
    g.fillStyle = `rgba(255,190,100,${a})`; g.beginPath(); g.arc(x, y, r * k, 0, 7); g.fill();
  }
}
function draw(t) {
  g.fillStyle = '#070a1c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0c1030'; g.fillRect(0, H * .3 | 0, W, H);
  g.fillStyle = '#10153c'; g.fillRect(0, H * .55 | 0, W, H);
  for (const [x, y, p] of stars) { g.fillStyle = Math.sin(t / 900 + p) > .5 ? '#fff' : '#8e93c4'; g.fillRect(x, y, 1, 1); }
  const mx = W * .88 | 0, my = W < 150 ? H * .4 | 0 : 24;
  g.fillStyle = '#f4f2ff'; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.fill();
  g.fillStyle = my > H * .3 ? '#0c1030' : '#070a1c'; g.beginPath(); g.arc(mx + 4, my - 3, 8, 0, 7); g.fill();
  const gr = H - 18;
  for (const [x, y, w, h] of houses) {
    g.fillStyle = '#090b1a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#1a2150'; g.fillRect(x - 1, y - 3, w + 2, 3); g.fillRect(x + w - 9, y - 9, 4, 6);
  }
  for (const w of wins) {
    const on = lit.has(w);
    if (on) glow(w.x + 2, w.y + 3, 12);
    g.fillStyle = on ? '#ffcf6b' : '#1d2c5c'; g.fillRect(w.x, w.y, 5, 6);
    g.fillStyle = on ? '#c98a3a' : '#11193a'; g.fillRect(w.x + 2, w.y, 1, 6);
  }
  g.fillStyle = '#161b34'; g.fillRect(0, gr, W, 18);
  g.fillStyle = '#232a4c'; for (let x = 0; x < W; x += 9) g.fillRect(x, gr + 3, 5, 1);
  for (const x of lamps) {
    g.fillStyle = '#03040c'; g.fillRect(x, gr - 22, 2, 24);
    g.fillStyle = '#ffcf6b'; g.fillRect(x - 2, gr - 27, 6, 6); glow(x + 1, gr - 24, 24);
  }
  if (img.complete && img.naturalWidth) {
    const bob = still ? 0 : Math.round(Math.sin(t / 500) * 2);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = queue.length ? .75 : .95;
    g.drawImage(img, 141, 131, 150, 170, Math.round(ghost.x - 15), Math.round(ghost.y - 17) + bob, 30, 34);
    g.globalAlpha = 1;
  }
}
function step(t) {
  if (queue.length) {
    const w = queue[0], dx = w.x + 2 - ghost.x, dy = w.y - 6 - ghost.y, d = Math.hypot(dx, dy), v = still ? 9999 : 2.2;
    if (d <= v) { ghost.x += dx; ghost.y += dy; lit.add(w); queue.shift(); count(); }
    else { ghost.x += dx / d * v; ghost.y += dy / d * v; }
  }
  draw(t); requestAnimationFrame(step);
}
cv.onclick = e => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  let best = null, bd = 12;
  for (const w of wins) {
    if (lit.has(w) || queue.includes(w)) continue;
    const d = Math.hypot(w.x + 2 - x, w.y + 3 - y); if (d < bd) { bd = d; best = w; }
  }
  if (best) queue.push(best);
};
let lastW = 0;
addEventListener('resize', () => { if (cv.clientWidth !== lastW) { lastW = cv.clientWidth; build(); } });
lastW = cv.clientWidth; build(); requestAnimationFrame(step);
