# Sabaki WASM integration — experimental

This PR installs `@sabaki/deadstones@2.2.0` and calls its real `guess()` API. The wasm URL is resolved by Vite, so it should respect the GitHub Pages base path `/go9/`.

Use the **死石を自動推定** button on the deployed 9×9 board. The guessed dead stones receive a yellow outline; errors are displayed in the UI.

**Limitations:** This is a runtime PoC. The guessed dead stones are **not** fed into the current score estimate, and they are **not** an authoritative Japanese-rules adjudication. Safari runtime, WASM loading, accuracy on known life/seki positions, and latency still require verification on device. The current score display remains provisional.

Source: https://github.com/SabakiHQ/deadstones (MIT). Preserve attribution to upstream.
