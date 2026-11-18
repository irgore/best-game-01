// The heads-up display drawn over the field: core integrity, watch number, score, combo and the
// dash charges. Purely a read of world state.

import { CORE, HULL, VIEW } from './config.js';

function bar(ctx, x, y, w, h, fill, tint) {
  ctx.fillStyle = '#00000075';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, fill)), h);
  ctx.strokeStyle = '#ffffff30';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function drawHud(ctx, world) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';

  ctx.fillStyle = '#8f7dab';
  ctx.fillText('CORE INTEGRITY', 24, 32);
  const ratio = world.core.hp / CORE.hp;
  const tint = ratio > 0.5 ? '#4de3d0' : ratio > 0.25 ? '#ffc43d' : '#ff3f6c';
  bar(ctx, 24, 40, 230, 12, ratio, tint);
  ctx.fillStyle = tint;
  ctx.fillText(`${Math.max(0, Math.ceil(world.core.hp))}%`, 262, 52);

  ctx.fillStyle = '#8f7dab';
  ctx.fillText('WATCH', VIEW.w - 24 - 150, 32);
  ctx.fillStyle = '#f3ecff';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(world.wave), VIEW.w - 24, 60);
  ctx.textAlign = 'left';

  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#8f7dab';
  ctx.fillText('SCORE', 24, VIEW.h - 34);
  ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ff8a3d';
  ctx.fillText(String(world.score), 24, VIEW.h - 8);

  if (world.combo > 1) {
    ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`x${world.combo}`, 130, VIEW.h - 12);
    const decay = 1 - world.comboTimer / world.comboWindow;
    bar(ctx, 130, VIEW.h - 8, 46, 3, decay, '#ffd16655');
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8f7dab';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.fillText('DASH', VIEW.w / 2, VIEW.h - 26);
  for (let i = 0; i < HULL.dashMax; i += 1) {
    const filled = i < world.hull.dashCharges;
    ctx.fillStyle = filled ? '#4de3d0' : '#31224a';
    ctx.beginPath();
    ctx.arc(VIEW.w / 2 - (HULL.dashMax - 1) * 11 + i * 22, VIEW.h - 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'left';

  ctx.fillStyle = '#6d5c88';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText(`swarm ${world.enemies.length}`, VIEW.w - 24 - 74, VIEW.h - 12);

  if (world.banner > 0) {
    ctx.globalAlpha = Math.min(1, world.banner);
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#4de3d0';
    ctx.fillText(world.bannerText, VIEW.w / 2, 132);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function a4(v) {
  return Math.max(0, Math.min(1, v));
}
