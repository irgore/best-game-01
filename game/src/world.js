// The run itself: wave ladder, spawner, collisions, scoring, the upgrade draft and the state the
// HUD and renderer read. One world object, stepped once per frame.

import {
  CORE, DRONE, HULL, SCORE, SPAWN_MIX, SPRINTER, UPGRADES, VIEW, WAVE,
} from './config.js';
import { makeRng, pickWeighted, shuffle } from './random.js';
import {
  makeBullet, makeEnemy, makeHull, makeSpark, startDash, stepEnemy, stepHull, stepSpark,
} from './entities.js';

export function createWorld(rng = makeRng(Date.now())) {
  const world = {
    rng,
    state: 'title',
    t: 0,
    shake: 0,
    wave: 1,
    score: 0,
    best: Number(localStorage.getItem('hollow-orbit-best') || 0),
    combo: 1,
    comboTimer: 0,
    comboWindow: 3.2,
    banner: 0,
    bannerText: '',
    spawnTimer: 1,
    toSpawn: 0,
    spawnGap: WAVE.spawnStart,
    restTimer: 0,
    picks: [],
    pickTimer: 0,
    core: { x: VIEW.cx, y: VIEW.cy, hp: CORE.hp, shield: CORE.shieldCharges, damageCut: 0 },
    hull: makeHull(),
    enemies: [],
    bullets: [],
    sparks: [],
    pops: [],
    over: { score: 0, wave: 1, best: 0 },
  };
  for (let i = 0; i < 7; i += 1) {
    world.enemies.push(makeEnemy(i % 3 === 0 ? 'bulwark' : 'drone', rng, 1));
  }
  return world;
}

export function resetRun(world) {
  world.state = 'play';
  world.t = 0;
  world.shake = 0;
  world.wave = 1;
  world.score = 0;
  world.combo = 1;
  world.comboTimer = 0;
  world.banner = 1.4;
  world.bannerText = 'WATCH 1 — HOLD';
  world.spawnTimer = 1.6;
  world.toSpawn = WAVE.countStart;
  world.spawnGap = WAVE.spawnStart;
  world.restTimer = 0;
  world.picks = [];
  world.core = { x: VIEW.cx, y: VIEW.cy, hp: CORE.hp, shield: CORE.shieldCharges, damageCut: 0 };
  world.hull = makeHull();
  world.enemies = [];
  world.bullets = [];
  world.sparks = [];
  world.pops = [];
}

function spawnOne(world) {
  const kind = pickWeighted(world.rng, SPAWN_MIX);
  world.enemies.push(makeEnemy(kind, world.rng, world.wave));
}

export function startWave(world, index) {
  world.wave = index;
  world.toSpawn = WAVE.countStart + (index - 1) * WAVE.countGrow;
  world.spawnGap = Math.max(WAVE.spawnFloor, WAVE.spawnStart * Math.pow(WAVE.spawnRamp, index - 1));
  world.banner = 1.3;
  world.bannerText = `WATCH ${index}`;
  if (index > 1) {
    world.core.hp = Math.min(CORE.hp, world.core.hp + CORE.repairPerWave);
  }
}

export function openDraft(world) {
  world.state = 'draft';
  world.pickTimer = WAVE.restSeconds;
  const offered = shuffle(world.rng, UPGRADES).slice(0, 3);
  world.picks = offered;
}

export function takeUpgrade(world, index) {
  const pick = world.picks[index];
  if (!pick) return;
  switch (pick.id) {
    case 'rapid': world.hull.fireGap = Math.max(0.055, world.hull.fireGap * 0.82); break;
    case 'heavy': world.hull.bulletDamage += 1; break;
    case 'pierce': world.hull.pierce += 1; break;
    case 'dash': world.hull.dashMax = Math.min(5, world.hull.dashMax + 1); HULL.dashRecharge = Math.max(1.2, HULL.dashRecharge * 0.85); HULL.dashMax = world.hull.dashMax; break;
    case 'speed': world.hull.accel *= 1.1; world.hull.maxSpeed *= 1.1; break;
    case 'shield': world.core.damageCut = Math.min(14, world.core.damageCut + 8); break;
    case 'repair': world.core.hp = Math.min(CORE.hp, world.core.hp + 18); break;
    default: break;
  }
  world.picks = [];
  world.state = 'play';
  startWave(world, world.wave + 1);
}

export function addPop(world, x, y, text, hue) {
  world.pops.push({ x, y, text, hue, life: 0.9 });
}

export function hurtCore(world, amount) {
  const dealt = Math.max(2, amount - world.core.damageCut);
  world.core.hp -= dealt;
  world.shake = Math.min(16, world.shake + 7);
  addPop(world, world.core.x, world.core.y - 60, `-${dealt}`, 0);
  if (world.core.hp <= 0) {
    world.core.hp = 0;
    world.state = 'over';
    world.over = { score: world.score, wave: world.wave, best: world.best };
    if (world.score > world.best) {
      world.best = world.score;
      world.over.best = world.score;
      localStorage.setItem('hollow-orbit-best', String(world.score));
    }
  }
}

function burst(world, x, y, hue, count) {
  for (const spark of makeSpark(x, y, hue, count)) world.sparks.push(spark);
}

export function stepWorld(world, input, dt, sfx) {
  world.t += dt;
  world.shake = Math.max(0, world.shake - dt * 26);

  for (const spark of world.sparks) stepSpark(spark, dt);
  world.sparks = world.sparks.filter((s) => s.life > 0);

  for (const pop of world.pops) { pop.y -= dt * 34; pop.life -= dt; }
  world.pops = world.pops.filter((p) => p.life > 0);

  if (world.banner > 0) world.banner -= dt * 0.9;

  if (world.state === 'draft') {
    world.pickTimer -= dt;
    for (let i = 0; i < 3; i += 1) {
      if (input.pressed(`Digit${i + 1}`)) { sfx.upgrade(); takeUpgrade(world, i); return; }
    }
    if (world.pickTimer <= 0) takeUpgrade(world, 0);
    return;
  }

  if (world.state !== 'play') return;

  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 1;
  }

  const hull = world.hull;
  stepHull(hull, input, dt);

  if (input.pressed('Space') && startDash(hull)) {
    sfx.dash();
    burst(world, hull.x, hull.y, 168, 10);
  }

  if (input.firing && hull.fireTimer <= 0) {
    world.bullets.push(makeBullet(hull));
    hull.fireTimer = hull.fireGap;
    sfx.shoot();
  }

  for (const bullet of world.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }
  world.bullets = world.bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < VIEW.w + 20 && b.y > -20 && b.y < VIEW.h + 20);

  if (world.toSpawn > 0) {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      spawnOne(world);
      world.toSpawn -= 1;
      world.spawnTimer = world.spawnGap;
    }
  }

  for (const enemy of world.enemies) stepEnemy(enemy, world.core, dt);

  // rounds against the swarm
  for (const bullet of world.bullets) {
    for (const enemy of world.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - bullet.x;
      const dy = enemy.y - bullet.y;
      if (dx * dx + dy * dy > (enemy.radius + 4) ** 2) continue;
      enemy.hp -= bullet.damage;
      enemy.flash = 1;
      bullet.life -= 10;
      if (bullet.pierce > 0) bullet.pierce -= 1;
      else bullet.life = 0;
      burst(world, bullet.x, bullet.y, 44, 3);
      sfx.hit();
      if (enemy.hp <= 0) {
        burst(world, enemy.x, enemy.y, 285, 14);
        sfx.kill();
        world.combo = Math.min(SCORE.comboMax, world.combo + (world.combo > 1 ? 1 : 1));
        world.comboTimer = world.comboWindow;
        const gain = enemy.score * world.combo;
        world.score += gain;
        addPop(world, enemy.x, enemy.y - 16, `+${gain}`, 1);
      }
      break;
    }
  }
  world.bullets = world.bullets.filter((b) => b.life > 0);

  // the swarm reaching the core, and the hull ramming it
  for (const enemy of world.enemies) {
    const dx = world.core.x - enemy.x;
    const dy = world.core.y - enemy.y;
    const gap = Math.hypot(dx, dy);
    if (gap < CORE.radius + enemy.radius) {
      enemy.hp = 0;
      burst(world, enemy.x, enemy.y, 12, 12);
      sfx.coreHit();
      hurtCore(world, enemy.damage);
      continue;
    }
    if (enemy.hp > 0 && hull.invuln <= 0) {
      const hd = Math.hypot(hull.x - enemy.x, hull.y - enemy.y);
      if (hd < HULL.radius + enemy.radius) {
        enemy.hp -= 2;
        enemy.flash = 1;
        burst(world, hull.x, hull.y, 320, 6);
        if (enemy.hp <= 0) {
          world.score += enemy.score * world.combo;
          sfx.kill();
        }
      }
    }
  }
  world.enemies = world.enemies.filter((e) => e.hp > 0);

  if (world.toSpawn <= 0 && world.enemies.length === 0) {
    world.score += SCORE.waveClear;
    sfx.waveClear();
    openDraft(world);
  }
}

export { DRONE, SPRINTER };
