// Boot and the frame loop. Wires the overlays, keys for start/pause/restart, and draws every
// layer in order. The world advances only while the state is play or draft.

import { VIEW, WAVE, UPGRADES } from './config.js';
import { createInput } from './input.js';
import { sfx } from './audio.js';
import { makeRng } from './random.js';
import {
  drawBackdrop, drawBullet, drawCore, drawEnemy, drawHull, drawPops, drawSpark, drawVignette, makeStars,
} from './render.js';
import { drawHud } from './hud.js';
import { createWorld, openDraft, resetRun, stepWorld, takeUpgrade } from './world.js';

const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const world = createWorld(makeRng(20261118));
const stars = makeStars(makeRng(7));

const el = {
  title: document.getElementById('screen-title'),
  over: document.getElementById('screen-over'),
  pause: document.getElementById('screen-pause'),
  draft: document.getElementById('screen-upgrade'),
  overScore: document.getElementById('over-score'),
  overWave: document.getElementById('over-wave'),
  overBest: document.getElementById('over-best'),
  upWave: document.getElementById('up-wave'),
  upList: document.getElementById('up-list'),
  upTimer: document.getElementById('up-timer'),
};

let paused = false;
let last = performance.now();
window.orbit = world;
window.orbitDebug = { draft: () => openDraft(world) };

function show(node, on) {
  node.classList.toggle('hidden', !on);
}

function begin() {
  sfx.resume();
  resetRun(world);
  show(el.title, false);
  show(el.over, false);
  show(el.draft, false);
  paused = false;
}

function finishOverlay() {
  el.overScore.textContent = String(world.over.score);
  el.overWave.textContent = `watch ${world.over.wave}`;
  el.overBest.textContent = String(world.over.best);
  show(el.over, true);
}

function paintDraft() {
  el.upWave.textContent = String(world.wave + 1);
  el.upList.innerHTML = '';
  world.picks.forEach((pick, i) => {
    const row = document.createElement('li');
    row.innerHTML = `<b>${i + 1}. ${pick.name}</b>${pick.text}`;
    row.addEventListener('click', () => { sfx.upgrade(); takeUpgrade(world, i); show(el.draft, false); });
    el.upList.appendChild(row);
  });
  show(el.draft, true);
}

el.title.addEventListener('click', begin);
el.over.addEventListener('click', begin);

window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Enter' && world.state === 'title') begin();
  if (ev.code === 'KeyR' && world.state === 'over') begin();
  if (ev.code === 'KeyP' && (world.state === 'play' || world.state === 'draft')) {
    paused = !paused;
    show(el.pause, paused);
  }
});

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!paused) {
    const before = world.state;
    stepWorld(world, input, dt, sfx);
    if (before !== 'over' && world.state === 'over') finishOverlay();
    if (world.state === 'draft' && before !== 'draft') paintDraft();
    if (before === 'draft' && world.state === 'play') show(el.draft, false);
    if (world.state === 'draft') el.upTimer.textContent = `${Math.max(0, world.pickTimer).toFixed(1)}s`;
  }

  drawBackdrop(ctx, stars, world.t, world.shake);
  if (world.state !== 'title') {
    drawCore(ctx, world.core, world.t);
    for (const enemy of world.enemies) drawEnemy(ctx, enemy);
    for (const bullet of world.bullets) drawBullet(ctx, bullet);
    drawHull(ctx, world.hull, world.t);
    for (const spark of world.sparks) drawSpark(ctx, spark);
    drawPops(ctx, world.pops);
    drawVignette(ctx);
    drawHud(ctx, world);
  }

  if (world.state === 'title') {
    drawCore(ctx, world.core, world.t);
    drawHull(ctx, world.hull, world.t);
    drawVignette(ctx);
  }

  input.clearFrame();
  requestAnimationFrame(frame);
}

// keep the draft list and wave label honest even if the draft times out
setInterval(() => {
  if (world.state === 'draft' && el.upList.children.length === 0) paintDraft();
}, 400);

requestAnimationFrame(frame);
