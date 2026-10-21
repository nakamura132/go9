import { BOARD_SIZE, emptyBoard, indexOf, type Board, type Stone } from "./board";

export type Player = 1 | 2;
export type GameState = {
  board: Board;
  toPlay: Player;
  previousBoard: Board | null;
  captures: { 1: number; 2: number };
  passes: number;
  finished: boolean;
  moveNumber: number;
};
export type MoveResult = { ok: true; state: GameState; captured: number } | { ok: false; reason: string };
export const opponent = (player: Player): Player => player === 1 ? 2 : 1;
export function newGame(): GameState {
  return { board: emptyBoard(), toPlay: 1, previousBoard: null, captures: { 1: 0, 2: 0 }, passes: 0, finished: false, moveNumber: 0 };
}
function neighbors(point: number): number[] {
  const row = Math.floor(point / BOARD_SIZE), col = point % BOARD_SIZE;
  const result: number[] = [];
  if (row > 0) result.push(point - BOARD_SIZE);
  if (row < BOARD_SIZE - 1) result.push(point + BOARD_SIZE);
  if (col > 0) result.push(point - 1);
  if (col < BOARD_SIZE - 1) result.push(point + 1);
  return result;
}
function group(board: Board, start: number): { stones: number[]; liberties: Set<number> } {
  const color = board[start];
  if (color === 0) throw new Error("Cannot inspect empty group");
  const seen = new Set([start]), pending = [start], liberties = new Set<number>();
  while (pending.length) {
    const current = pending.pop()!;
    for (const next of neighbors(current)) {
      if (board[next] === 0) liberties.add(next);
      else if (board[next] === color && !seen.has(next)) { seen.add(next); pending.push(next); }
    }
  }
  return { stones: [...seen], liberties };
}
function equalBoard(a: Board, b: Board): boolean { return a.length === b.length && a.every((s, i) => s === b[i]); }
export function play(state: GameState, row: number, col: number): MoveResult {
  if (state.finished) return { ok: false, reason: "対局は終了しています" };
  let point: number;
  try { point = indexOf(row, col); } catch { return { ok: false, reason: "盤外には打てません" }; }
  if (state.board[point] !== 0) return { ok: false, reason: "すでに石があります" };
  const next = [...state.board] as Stone[];
  next[point] = state.toPlay;
  const checked = new Set<number>();
  let captured = 0;
  for (const adjacent of neighbors(point)) {
    if (next[adjacent] !== opponent(state.toPlay) || checked.has(adjacent)) continue;
    const target = group(next, adjacent);
    target.stones.forEach(s => checked.add(s));
    if (target.liberties.size === 0) {
      for (const stone of target.stones) next[stone] = 0;
      captured += target.stones.length;
    }
  }
  if (group(next, point).liberties.size === 0) return { ok: false, reason: "自殺手は打てません" };
  if (state.previousBoard && equalBoard(next, state.previousBoard)) return { ok: false, reason: "コウのため直後の取り返しはできません" };
  return { ok: true, captured, state: {
    ...state, board: next, toPlay: opponent(state.toPlay), previousBoard: state.board,
    captures: { ...state.captures, [state.toPlay]: state.captures[state.toPlay] + captured },
    passes: 0, moveNumber: state.moveNumber + 1
  }};
}
export function pass(state: GameState): GameState {
  if (state.finished) return state;
  const passes = state.passes + 1;
  return { ...state, previousBoard: state.board, toPlay: opponent(state.toPlay), passes, finished: passes >= 2, moveNumber: state.moveNumber + 1 };
}
export function resume(state: GameState): GameState {
  return { ...state, finished: false, passes: 0 };
}
export type ScoreEstimate = { blackTerritory: number; whiteTerritory: number; neutral: number; black: number; white: number; winner: "black" | "white" | "tie"; margin: number };
/** Japanese territory estimate: does not automatically detect dead stones or seki. */
export function estimateScore(state: GameState, komi = 6.5): ScoreEstimate {
  const visited = new Set<number>();
  let blackTerritory = 0, whiteTerritory = 0, neutral = 0;
  state.board.forEach((stone, start) => {
    if (stone !== 0 || visited.has(start)) return;
    const region = [start], border = new Set<Player>();
    visited.add(start);
    for (let i = 0; i < region.length; i++) {
      for (const adjacent of neighbors(region[i])) {
        const color = state.board[adjacent];
        if (color !== 0) border.add(color);
        else if (!visited.has(adjacent)) { visited.add(adjacent); region.push(adjacent); }
      }
    }
    if (border.size === 1 && border.has(1)) blackTerritory += region.length;
    else if (border.size === 1 && border.has(2)) whiteTerritory += region.length;
    else neutral += region.length;
  });
  const black = blackTerritory + state.captures[1];
  const white = whiteTerritory + state.captures[2] + komi;
  const difference = black - white;
  return { blackTerritory, whiteTerritory, neutral, black, white, winner: difference > 0 ? "black" : difference < 0 ? "white" : "tie", margin: Math.abs(difference) };
}
