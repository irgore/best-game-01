// The hull, its rounds, the swarm and its sparks. Every factory returns a plain record and the
// step functions move them; nothing here draws or touches the DOM.

import { BULWARK, DRONE, HULL, SPRINTER, VIEW } from './config.js';
import { range } from './random.js';

const SHAPES = { drone: DRONE, sprinter: SPRINTER, bulwark: BULWARK };

export function makeHull() {
  return {
    x: VIEW.cx,
    y: VIEW.cy + 150,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    fireTimer: 0,
    dashTimer: 0,
    dashCharges: HULL.dashMax,
    rechargeTimer: 0,
    invuln: 0,
    accel: HULL.accel,
    maxSpeed: HULL.maxSpeed,
    fireGap: HULL.fireGap,
    bulletDamage: HULL.bulletDamage,
    pierce: HULL.pierce,
  };
}

export function makeEnemy(kind, rng, wave) {
  const shape = SHAPES[kind];
  const a = rng() * Math.PI * 2;
  const boost = 1 + wave * 0.045;
  const ring = range(rng, 210, 300);
  const px = Math.min(VIEW.w - 26, Math.max(26, VIEW.cx + Math.cos(a) * ring));
  const py = Math.min(VIEW.h - 26, Math.max(26, VIEW.cy + Math.sin(a) * ring));
  return {
    kind,
    x: px,
    y: py,
    vx: 0,
    vy: 0,
    angle: a,
    hp: shape.hp + Math.floor(wave / 4),
    maxHp: shape.hp + Math.floor(wave / 4),
    radius: shape.radius,
    speed: shape.speed * boost,
    turn: shape.turn,
    damage: shape.coreDamage,
    score: shape.score,
    flash: 0,
    wobble: rng() * Math.PI * 2,
  };
}

export function makeBullet(hull) {
  const spread = (Math.random() - 0.5) * 0.05;
  const a = hull.angle + spread;
  return {
    x: hull.x + Math.cos(a) * 14,
    y: hull.y + Math.sin(a) * 14,
    vx: Math.cos(a) * HULL.bulletSpeed,
    vy: Math.sin(a) * HULL.bulletSpeed,
    life: HULL.bulletLife,
    damage: hull.bulletDamage,
    pierce: hull.pierce,
    angle: a,
  };
}

export function makeSpark(x, y, hue, count) {
  const sparks = [];
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 190;
    sparks.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.24 + Math.random() * 0.4,
      maxLife: 0.64,
      hue,
      size: 1 + Math.random() * 2.4,
    });
  }
  return sparks;
}

export function stepHull(hull, input, dt) {
  const ax = input.axisX();
  const ay = input.axisY();
  const len = Math.hypot(ax, ay) || 1;
  hull.vx += (ax / len) * hull.accel * dt;
  hull.vy += (ay / len) * hull.accel * dt;

  const drag = 1 - Math.min(1, HULL.drag * dt);
  hull.vx *= drag;
  hull.vy *= drag;

  const speed = Math.hypot(hull.vx, hull.vy);
  if (speed > hull.maxSpeed) {
    hull.vx = (hull.vx / speed) * hull.maxSpeed;
    hull.vy = (hull.vy / speed) * hull.maxSpeed;
  }

  hull.x += hull.vx * dt;
  hull.y += hull.vy * dt;

  const pad = HULL.radius + 4;
  if (hull.x < pad) { hull.x = pad; hull.vx = Math.abs(hull.vx) * 0.4; }
  if (hull.x > VIEW.w - pad) { hull.x = VIEW.w - pad; hull.vx = -Math.abs(hull.vx) * 0.4; }
  if (hull.y < pad) { hull.y = pad; hull.vy = Math.abs(hull.vy) * 0.4; }
  if (hull.y > VIEW.h - pad) { hull.y = VIEW.h - pad; hull.vy = -Math.abs(hull.vy) * 0.4; }

  hull.angle = Math.atan2(input.aimY - hull.y, input.aimX - hull.x);

  if (hull.dashTimer > 0) {
    hull.dashTimer -= dt;
    hull.invuln = Math.max(hull.invuln, 0.08);
  }

  hull.invuln = Math.max(0, hull.invuln - dt);
  hull.fireTimer = Math.max(0, hull.fireTimer - dt);

  if (hull.dashCharges < HULL.dashMax) {
    hull.rechargeTimer -= dt;
    if (hull.rechargeTimer <= 0) {
      hull.dashCharges += 1;
      hull.rechargeTimer = HULL.dashRecharge;
    }
  }
}

export function startDash(hull) {
  if (hull.dashCharges <= 0) return false;
  hull.dashCharges -= 1;
  if (hull.rechargeTimer <= 0) hull.rechargeTimer = HULL.dashRecharge;
  hull.dashTimer = HULL.dashTime;
  hull.invuln = HULL.invulnAfterDash;
  const a = Math.atan2(hull.vy, hull.vx);
  const dir = Math.hypot(hull.vx, hull.vy) > 20 ? a : hull.angle;
  hull.vx = Math.cos(dir) * HULL.dashSpeed;
  hull.vy = Math.sin(dir) * HULL.dashSpeed;
  return true;
}

export function stepEnemy(enemy, core, dt) {
  const dx = core.x - enemy.x;
  const dy = core.y - enemy.y;
  const want = Math.atan2(dy, dx);
  let diff = want - enemy.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const turn = Math.min(Math.abs(diff), enemy.turn * dt) * Math.sign(diff);
  enemy.angle += turn;
  enemy.wobble += dt * 3.4;
  const drift = Math.sin(enemy.wobble) * 26;
  enemy.x += Math.cos(enemy.angle) * enemy.speed * dt + Math.cos(enemy.angle + Math.PI / 2) * drift * dt;
  enemy.y += Math.sin(enemy.angle) * enemy.speed * dt + Math.sin(enemy.angle + Math.PI / 2) * drift * dt;
  enemy.flash = Math.max(0, enemy.flash - dt * 3);
}

export function stepSpark(spark, dt) {
  spark.x += spark.vx * dt;
  spark.y += spark.vy * dt;
  spark.vx *= 0.94;
  spark.vy *= 0.94;
  spark.life -= dt;
}
