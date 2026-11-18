// Seeded generator so a run can be replayed from its seed, plus the small helpers the
// world uses for weighted picks and ranged floats.

export function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function pickWeighted(rng, table) {
  let roll = rng();
  for (const row of table) {
    roll -= row.share;
    if (roll <= 0) return row.kind;
  }
  return table[table.length - 1].kind;
}

export function shuffle(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
