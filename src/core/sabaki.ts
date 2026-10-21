import { guess, useFetch } from "@sabaki/deadstones";
import wasmUrl from "@sabaki/deadstones/wasm/deadstones_bg.wasm?url";
import type { DeadStoneGuesser } from "./deadstones";

// Vite rewrites the asset URL with the /go9/ base path for GitHub Pages.
useFetch(wasmUrl);
export const guessDeadStones: DeadStoneGuesser = (board, options) => guess(board, options);
