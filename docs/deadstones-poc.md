# Sabaki deadstones PoC — Stage 1

This PR introduces a **tested API boundary**, not yet a working WASM integration.

Source: [SabakiHQ/deadstones](https://github.com/SabakiHQ/deadstones) (MIT).

## Verified by unit tests (once CI passes)

- go9 board: row-major `0=empty, 1=black, 2=white`
- Sabaki input: 9 rows × 9 columns; `0=empty, 1=black, -1=white`
- Sabaki output: `[x,y]` coordinates; mapped back to go9 row-major boolean dead mask
- Reject invalid coordinates, empty points, and wrong board dimensions
- Explicit `estimated` status: result is not a definitive Japanese-rule adjudication

## Not yet verified / next stage

- Install and bundle `@sabaki/deadstones` WASM in Vite.
- Validate GitHub Pages `/go9/` base path and iPhone Safari WASM loading.
- Test actual estimator output on known dead/live/seki positions; benchmark 9×9 performance.
- Add dead-group correction UI and connect the corrected mask to goscorer.
- Do not claim automatic dead stone recognition works until the real library runs.

The adapter takes a `DeadStoneGuesser` function, allowing the Sabaki runtime to be added or replaced without changing the app's rules or UI.
