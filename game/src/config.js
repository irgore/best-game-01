// Tunable numbers for Hollow Orbit in one place: view size, the core's health, how the
// wave ladder grows, hull stats, dash budget and the upgrade table the player picks from.

export const VIEW = { w: 960, h: 600, cx: 480, cy: 300 };

export const CORE = {
  hp: 100,
  radius: 46,
  repairPerWave: 12,
  shieldCharges: 3,
};

export const HULL = {
  radius: 11,
  accel: 1750,
  drag: 6.2,
  maxSpeed: 330,
  fireGap: 0.16,
  bulletSpeed: 640,
  bulletLife: 1.15,
  bulletDamage: 1,
  pierce: 0,
  dashSpeed: 880,
  dashTime: 0.16,
  dashMax: 2,
  dashRecharge: 2.6,
  invulnAfterDash: 0.28,
};

export const WAVE = {
  restSeconds: 20,
  spawnStart: 0.7,
  spawnFloor: 0.18,
  spawnRamp: 0.9,
  countStart: 12,
  countGrow: 5,
};

export const DRONE = {
  radius: 16,
  speed: 62,
  turn: 1.7,
  hp: 2,
  coreDamage: 9,
  score: 10,
};

export const SPRINTER = {
  radius: 11,
  speed: 128,
  turn: 2.6,
  hp: 1,
  coreDamage: 6,
  score: 15,
};

export const BULWARK = {
  radius: 25,
  speed: 44,
  turn: 1.1,
  hp: 7,
  coreDamage: 18,
  score: 30,
};

export const SPAWN_MIX = [
  { kind: 'drone', share: 0.62 },
  { kind: 'sprinter', share: 0.26 },
  { kind: 'bulwark', share: 0.12 },
];

export const UPGRADES = [
  { id: 'rapid', name: 'RAPID FEED', text: 'Fire 18% faster.', cost: 0 },
  { id: 'heavy', name: 'HEAVY SLUG', text: '+1 bullet damage.', cost: 0 },
  { id: 'pierce', name: 'SPLIT ROUND', text: 'Shots pass through +1 hull.', cost: 0 },
  { id: 'dash', name: 'VENT BOOST', text: '+1 dash charge, faster refill.', cost: 0 },
  { id: 'speed', name: 'TRIM THRUST', text: 'Fly 10% faster.', cost: 0 },
  { id: 'shield', name: 'CORE PLATE', text: 'Core takes 8 less damage per hit.', cost: 0 },
  { id: 'repair', name: 'WELD CREW', text: 'Repair 18 core integrity.', cost: 0 },
];

export const SCORE = {
  waveClear: 40,
  comboStep: 4,
  comboMax: 8,
};
