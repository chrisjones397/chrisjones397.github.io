/* Eased text: the opening title drifts down a little as you scroll, and the profile text rises
   into its place as its section arrives. Each follows the scroll a moment late and settles with a
   slight spring. Nothing moves for visitors who have asked their device to reduce motion. */
(function () {
  const DELAY = 0.15;      // seconds the text waits before following the scroll
  const STIFFNESS = 120;   // higher: springier and quicker
  const DAMPING = 14;      // lower: more overshoot (22 would be none at all)
  const TITLE_DRIFT = 0.3; // the title moves down this fraction of the distance scrolled
  const RISE = 0.35;       // the profile text starts this fraction of its section's distance below its place

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pieces = [];
  const title = document.querySelector('.hero-title');
  if (title) pieces.push({ el: title, target: () => TITLE_DRIFT * Math.max(scrollY, 0) });
  const words = document.querySelector('.face-words'), stage = document.querySelector('.face-stage');
  if (words && stage) pieces.push({ el: words, target: () => RISE * Math.max(stage.getBoundingClientRect().top, 0) });
  if (!pieces.length) return;

  const history = [];                     // recent [time, targets] pairs, so the text can follow late
  for (const p of pieces) { p.x = p.target(); p.v = 0; }
  let last = performance.now() / 1000, running = false;

  function delayedTargets(now) {
    history.push([now, pieces.map(p => p.target())]);
    while (history.length > 2 && history[1][0] <= now - DELAY) history.shift();
    return history[0][1];
  }
  function step(ms) {
    const now = ms / 1000, dt = Math.min(now - last, 1 / 30); last = now;
    const goal = delayedTargets(now);
    let busy = false;
    pieces.forEach((p, i) => {
      const a = -STIFFNESS * (p.x - goal[i]) - DAMPING * p.v;   // a spring pulling towards where it should be
      p.v += a * dt; p.x += p.v * dt;
      if (Math.abs(p.x - goal[i]) > 0.1 || Math.abs(p.v) > 0.1) busy = true;
      p.el.style.translate = `0 ${p.x.toFixed(2)}px`;
    });
    if (busy || pieces.some((p, i) => Math.abs(p.target() - goal[i]) > 0.1)) requestAnimationFrame(step);
    else running = false;
  }
  function wake() {
    if (!running) { running = true; last = performance.now() / 1000; requestAnimationFrame(step); }
  }
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', wake);
  wake();
})();
