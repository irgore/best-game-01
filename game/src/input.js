// Keyboard and pointer state, kept in one object the world reads each frame. Listeners are
// attached once to the stage and translate raw events into intent flags and a world-space aim.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    aimX: 480,
    aimY: 300,
    firing: false,
    pressedThisFrame: new Set(),
  };

  const moveKeys = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ]);

  function toWorld(ev) {
    const box = canvas.getBoundingClientRect();
    state.aimX = ((ev.clientX - box.left) / box.width) * canvas.width;
    state.aimY = ((ev.clientY - box.top) / box.height) * canvas.height;
  }

  window.addEventListener('keydown', (ev) => {
    if (moveKeys.has(ev.code) || ev.code === 'Space') ev.preventDefault();
    if (!keys.has(ev.code)) state.pressedThisFrame.add(ev.code);
    keys.add(ev.code);
  });

  window.addEventListener('keyup', (ev) => {
    keys.delete(ev.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    state.firing = false;
  });

  canvas.addEventListener('pointermove', toWorld);
  canvas.addEventListener('pointerdown', (ev) => {
    toWorld(ev);
    state.firing = true;
  });
  window.addEventListener('pointerup', () => {
    state.firing = false;
  });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  state.down = (code) => keys.has(code);
  state.pressed = (code) => state.pressedThisFrame.has(code);
  state.axisX = () => (state.down('KeyD') || state.down('ArrowRight') ? 1 : 0) - (state.down('KeyA') || state.down('ArrowLeft') ? 1 : 0);
  state.axisY = () => (state.down('KeyS') || state.down('ArrowDown') ? 1 : 0) - (state.down('KeyW') || state.down('ArrowUp') ? 1 : 0);
  state.clearFrame = () => state.pressedThisFrame.clear();

  return state;
}
