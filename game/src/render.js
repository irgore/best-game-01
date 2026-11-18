// Every draw call lives here: the void backdrop, the core and its shield ring, the hull, the swarm
// shapes, rounds, sparks and the floating score pops. Reads state, mutates nothing.

import { CORE, VIEW } from './config.js';

const STAR_COUNT = 140;

export function makeStars(rng) {
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push({
      x: rng() * VIEW.w,
      y: rng() * VIEW.h,
      r: 0.4 + rng() * 1.5,
      a: 0.16 + rng() * 0.4,
      drift: 3 + rng() * 12,
    });
  }
  return stars;
}

export function drawBackdrop(ctx, stars, t, shake) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = ctx.createRadialGradient(VIEW.cx, VIEW.cy, 30, VIEW.cx, VIEW.cy, 420);
  sky.addColorStop(0, '#5b2d8f');
  sky.addColorStop(0.45, '#2f1758');
  sky.addColorStop(1, '#0d0522');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  const nebA = ctx.createRadialGradient(190, 120, 10, 190, 120, 260);
  nebA.addColorStop(0, 'rgba(122,60,200,0.32)');
  nebA.addColorStop(1, 'rgba(122,60,200,0)');
  ctx.fillStyle = nebA;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  const nebB = ctx.createRadialGradient(800, 470, 10, 800, 470, 300);
  nebB.addColorStop(0, 'rgba(255,138,61,0.20)');
  nebB.addColorStop(1, 'rgba(255,138,61,0)');
  ctx.fillStyle = nebB;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  for (const star of stars) {
    star.y += star.drift * 0.016;
    if (star.y > VIEW.h) star.y -= VIEW.h;
    ctx.globalAlpha = Math.min(1, star.a * 2.6);
    ctx.fillStyle = '#e6d8ff';
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#7a52b31f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 0; gx <= VIEW.w; gx += 60) { ctx.moveTo(gx, 0); ctx.lineTo(gx, VIEW.h); }
  for (let gy = 0; gy <= VIEW.h; gy += 60) { ctx.moveTo(0, gy); ctx.lineTo(VIEW.w, gy); }
  ctx.stroke();

  ctx.strokeStyle = '#6a45a077';
  for (const r of [180, 250, 320]) {
    ctx.beginPath();
    ctx.arc(VIEW.cx, VIEW.cy, r + Math.sin(t * 0.7 + r) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawCore(ctx, core, t) {
  const pulse = 1 + Math.sin(t * 3.2) * 0.045;
  const hurt = core.hp / CORE.hp;

  ctx.save();
  ctx.translate(core.x, core.y);

  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 130);
  const tint = hurt > 0.5 ? '77,227,208' : hurt > 0.25 ? '255,196,61' : '255,63,108';
  halo.addColorStop(0, `rgba(${tint},0.30)`);
  halo.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(t * 0.35);
  ctx.strokeStyle = `rgba(${tint},0.55)`;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, CORE.radius + 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.scale(pulse, pulse);
  const body = ctx.createRadialGradient(0, -8, 4, 0, 0, CORE.radius);
  body.addColorStop(0, '#f6fbff');
  body.addColorStop(0.4, '#6ce8dc');
  body.addColorStop(1, '#0f5f66');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, CORE.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#061a20';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, CORE.radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < core.shield; i += 1) {
    const a = t * 1.2 + (i * Math.PI * 2) / Math.max(1, core.shield);
    ctx.fillStyle = '#8ef2ff';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (CORE.radius + 26), Math.sin(a) * (CORE.radius + 26), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHull(ctx, hull, t) {
  const blink = hull.invuln > 0 && Math.floor(t * 22) % 2 === 0;
  ctx.save();
  ctx.translate(hull.x, hull.y);
  ctx.rotate(hull.angle);

  if (hull.dashTimer > 0) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#4de3d0';
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-6, 9);
    ctx.lineTo(-6, -9);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = blink ? '#ffffff' : '#ff8a3d';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, 9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, -9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2a1030';
  ctx.beginPath();
  ctx.arc(-1, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();

  if (Math.hypot(hull.vx, hull.vy) > 60) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-18 - Math.random() * 6, 3);
    ctx.lineTo(-18 - Math.random() * 6, -3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawEnemy(ctx, enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle);

  const hot = enemy.flash > 0;
  if (enemy.kind === 'drone') {
    ctx.fillStyle = hot ? '#ffffff' : '#cf9bff';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-9, 9);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, -9);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.kind === 'sprinter') {
    ctx.fillStyle = hot ? '#ffffff' : '#ff6d92';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-7, 6);
    ctx.lineTo(-7, -6);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = hot ? '#ffffff' : '#bda9e6';
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * enemy.radius;
      const py = Math.sin(a) * enemy.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c8b8ec';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (enemy.maxHp > 2 && enemy.hp < enemy.maxHp) {
    const w = enemy.radius * 1.7;
    ctx.rotate(-enemy.angle);
    ctx.fillStyle = '#00000088';
    ctx.fillRect(-w / 2, -enemy.radius - 9, w, 3);
    ctx.fillStyle = '#ff8a3d';
    ctx.fillRect(-w / 2, -enemy.radius - 9, (w * enemy.hp) / enemy.maxHp, 3);
  }
  ctx.restore();
}

export function drawBullet(ctx, bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(bullet.angle);
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = '#ffb703';
  ctx.shadowBlur = 10;
  ctx.fillRect(-6, -1.6, 12, 3.2);
  ctx.restore();
}

export function drawSpark(ctx, spark) {
  ctx.globalAlpha = Math.max(0, spark.life / spark.maxLife);
  ctx.fillStyle = `hsl(${spark.hue} 100% 70%)`;
  ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
  ctx.globalAlpha = 1;
}

export function drawPops(ctx, pops) {
  ctx.textAlign = 'center';
  for (const pop of pops) {
    ctx.globalAlpha = Math.min(1, pop.life * 2);
    ctx.fillStyle = pop.hue === 0 ? '#ff3f6c' : '#ffd166';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawVignette(ctx) {
  const shade = ctx.createRadialGradient(VIEW.cx, VIEW.cy, 300, VIEW.cx, VIEW.cy, 580);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.40)');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}
