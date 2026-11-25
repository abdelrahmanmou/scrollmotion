// Places the hand-drawn "see my work" note in the hero.
//
// The avatar changes size with the window height while the headline and the
// description do not, so a fixed position collides with them on some screens.
// This measures the free space and puts the note next to the laptop, below the
// headline and clear of the description, then draws the arrow to it. If no
// spot fits, the note is hidden rather than drawn on top of the text.
// It only reads the avatar's box; it never touches the avatar video or canvas.
(() => {
  const note = document.querySelector('.hero-note');
  if (!note) return;
  const link = note.querySelector('.hero-note-link');
  const svg = note.querySelector('.hero-note-arrow');
  const tilt = document.getElementById('tilt-container');
  const headline = document.querySelector('.hero-modern-headline h1');
  const desc = document.querySelector('.hero-description');
  const paths = svg ? svg.querySelectorAll('path') : [];
  if (!link || !svg || paths.length < 2) return;

  // The laptop's right edge inside the avatar frame (0 to 1)
  const LAPTOP = { x: 0.70, y: 0.47 };
  const GAP = 10; // px kept clear around the headline and description

  function layout() {
    const saved = tilt ? tilt.style.transform : '';
    if (tilt) tilt.style.transform = 'none'; // measure without the mouse tilt
    note.classList.remove('is-placed', 'is-hidden');
    link.style.left = link.style.top = '';

    const fw = note.offsetWidth;
    const fh = note.offsetHeight;
    const r = note.getBoundingClientRect();
    if (!fw || !fh || !r.width) { if (tilt) tilt.style.transform = saved; return; }
    const k = r.width / fw; // the frame is scaled up from its bottom edge
    const toLocal = (x, y) => [(x - r.left) / k, (y - r.top) / k];
    const u = fw / 480; // drawing unit, 1 at a typical desktop size

    const lw = link.offsetWidth;
    const lh = link.offsetHeight;
    const sx = LAPTOP.x * fw;
    const sy = LAPTOP.y * fh;

    // Keep-out areas, in the frame's own pixels
    const blocks = [];
    if (headline) {
      const h = headline.getBoundingClientRect();
      const it = headline.querySelector('.italic');
      const fs = parseFloat(getComputedStyle(it || headline).fontSize) || 0;
      // the line box includes room for descenders; the glyphs end a little higher
      const [x1, y1] = toLocal(h.left, h.top);
      const [x2, y2] = toLocal(h.right, h.bottom - fs * 0.12);
      blocks.push([x1, y1, x2, y2]);
    }
    if (desc && getComputedStyle(desc).position === 'absolute') {
      const d = desc.getBoundingClientRect();
      blocks.push([...toLocal(d.left, d.top), ...toLocal(d.right, d.bottom)]);
    }
    const g = GAP / k;
    const [minX] = toLocal(12, 0);
    const [maxX] = toLocal(document.documentElement.clientWidth - 12, 0);
    const fits = (x, y) =>
      x >= minX && x + lw <= maxX &&
      blocks.every(([a, b, c, d]) => x + lw + g <= a || x - g >= c || y + lh + g <= b || y - g >= d);

    // 1: to the right of the laptop, nudged down from the headline if needed
    // 2: above the laptop, beside the shoulder (narrow screens)
    const candidates = [];
    const ax = sx + Math.max(0.2 * fw, 60 * u);
    const headBottom = blocks.length ? blocks[0][3] + g : -Infinity;
    const ideal = sy - lh * 0.6;
    const beside = [];
    for (const x of [ax, sx + 36 * u]) {
      for (let ay = Math.max(sy - 0.16 * fh, headBottom); ay <= sy + 0.12 * fh; ay += 4 * u) {
        beside.push([x, ay, Math.abs(ay - ideal) + Math.abs(x - ax) * 0.6]);
      }
    }
    beside.sort((a, b) => a[2] - b[2]).forEach(([x, y]) => candidates.push([x, y]));
    const side = candidates.length;
    candidates.push([sx - 0.08 * fw, sy - 0.1 * fh - lh]);
    const i = candidates.findIndex(([x, y]) => fits(x, y));
    const spot = candidates[i];

    if (!spot) {
      note.classList.add('is-hidden');
      if (tilt) tilt.style.transform = saved;
      return;
    }
    const [lx, ly] = spot;
    link.style.left = `${lx}px`;
    link.style.top = `${ly}px`;

    const c = (dx, dy) => `${(sx + dx * u).toFixed(1)} ${(sy + dy * u).toFixed(1)}`;
    let ex, ey, c2x, c2y, body;
    if (i < side) {
      // Beside the laptop: a small curl, then a sweep to the start of the underline
      ex = lx - 4 * u;
      ey = ly + lh * 0.82;
      c2x = ex - (ex - sx) * 0.35;
      c2y = ey + 22 * u;
      body = `M${c(0, 0)} C ${c(22, 14)}, ${c(44, -2)}, ${c(36, -18)} C ${c(30, -30)}, ${c(10, -24)}, ${c(16, -8)} ` +
        `C ${c(26, 14)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    } else {
      // Above the laptop: curl out to the right, then up to the underline
      ex = Math.max(lx + lw * 0.55, sx + 24 * u);
      ey = ly + lh + 6 * u;
      c2x = ex + 14 * u;
      c2y = ey + 26 * u;
      body = `M${c(0, 0)} C ${c(18, 8)}, ${c(32, -2)}, ${c(26, -14)} C ${c(20, -24)}, ${c(6, -16)}, ${c(14, -6)} ` +
        `C ${c(24, 4)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    const tx = ex - c2x;
    const ty = ey - c2y;
    const len = Math.hypot(tx, ty) || 1;
    const [ux, uy] = [tx / len, ty / len];
    const hl = 14 * u;
    const wing = a => {
      const cos = Math.cos(a), sin = Math.sin(a);
      const bx = -ux, by = -uy;
      return `${(ex + (bx * cos - by * sin) * hl).toFixed(1)} ${(ey + (bx * sin + by * cos) * hl).toFixed(1)}`;
    };
    svg.setAttribute('viewBox', `0 0 ${fw} ${fh}`);
    paths[0].setAttribute('d', body);
    paths[1].setAttribute('d', `M${wing(0.5)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${wing(-0.5)}`);
    paths.forEach(p => {
      const L = Math.ceil(p.getTotalLength()) + 2;
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    });
    note.classList.add('is-placed');
    if (tilt) tilt.style.transform = saved;
  }

  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
  schedule();
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
