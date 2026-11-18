# Hollow Orbit

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/irgore/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/irgore/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

A one-more-run arcade defence game. You fly a single hull around a core you cannot move, and the
swarm comes from every edge of the field to eat it. Kill fast, bank combos, and pick one of three
upgrades every time you clear a watch — the ladder never stops climbing.

Built as an entry for make.fun's best-game-01 bounty. Plain ES modules and one canvas, no library,
no build step, no network request.

## Play

Serve the folder with any static server and open `game/index.html` in desktop Chrome:

```
node serve.ts
# http://localhost:8080
```

- **WASD / arrows** — fly
- **mouse** — aim, **hold left button** — fire
- **space / shift** — dash (charges refill over time; you are briefly invulnerable)
- **P** — pause, **R** — restart
- **1 / 2 / 3** — take an upgrade

The core has 100 integrity. Every hull that reaches it takes a bite, and when it hits zero the watch
ends. Clearing a watch opens the draft; the draft, the score and the run itself all reset on `R`.

## What is in here

| path | job |
| --- | --- |
| `game/index.html` | the page, the canvas and the four screens' markup |
| `game/src/config.js` | every tunable number: hull, swarm, dash budget, the upgrade table |
| `game/src/world.js` | the run: wave ladder, spawner, collisions, scoring, upgrade draft |
| `game/src/entities.js` | hull, rounds, hulls of the swarm and sparks, and how they step |
| `game/src/render.js` | every draw call, the backdrop, the core, the swarm shapes |
| `game/src/hud.js` | integrity, watch, score, combo and dash charges |
| `game/src/input.js` | keyboard and pointer intent, world-space aim |
| `game/src/audio.js` | synthesised shot, pop, hit, dash and wave cues |
| `game/src/random.js` | seeded generator, so a run replays from its seed |
| `game/src/style.css` | palette, layout and the overlay screens |
| `game/src/main.js` | boot, the frame loop, the screens |
| `screenshots/` | four real renders: start, play, the upgrade draft, the results |
| `main.ts` | hands the entry in: copies `game/` and `screenshots/`, writes the dossier |
| `vendor/makefun-game.ts` | the kit's `buildDossier`, unchanged |

## License

MIT, see `LICENSE`.
