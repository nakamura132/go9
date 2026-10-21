import { describe, expect, it } from "vitest";
import { indexOf } from "./board";
import { estimateScore, newGame, pass, play, resume, type GameState } from "./game";

function move(state: GameState, row: number, col: number): GameState {
  const result = play(state, row, col);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
describe("Go rules", () => {
  it("alternates turns and rejects occupied points", () => {
    const game = move(newGame(), 0, 0);
    expect(game.toPlay).toBe(2);
    expect(play(game, 0, 0).ok).toBe(false);
    expect(play(game, 9, 0).ok).toBe(false);
  });
  it("captures a single stone and counts prisoners", () => {
    let s = newGame();
    s = move(s, 0, 1); s = move(s, 1, 1);
    s = move(s, 1, 0); s = move(s, 8, 8);
    s = move(s, 1, 2); s = move(s, 8, 7);
    s = move(s, 2, 1);
    expect(s.board[indexOf(1, 1)]).toBe(0);
    expect(s.captures[1]).toBe(1);
  });
  it("rejects suicide without changing state", () => {
    let s = newGame();
    s = move(s, 8, 8); s = move(s, 0, 1);
    s = move(s, 8, 7); s = move(s, 1, 0);
    s = move(s, 7, 8); s = move(s, 1, 2);
    s = move(s, 7, 7); s = move(s, 2, 1);
    expect(play(s, 1, 1)).toMatchObject({ ok: false });
    expect(s.board[indexOf(1, 1)]).toBe(0);
  });
  it("allows a move with no liberties when it captures neighbors", () => {
    let s = newGame();
    // Black captures a white corner stone at (0,0) by playing (0,1).
    s = move(s, 1, 0); s = move(s, 0, 0);
    const result = play(s, 0, 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.board[indexOf(0, 0)]).toBe(0);
  });
  it("rejects immediate ko recapture", () => {
    let s = newGame();
    // Shape around (1,1) and (1,2): black captures white at (1,2).
    // B: (0,2),(2,2),(1,3); W: (1,2),(0,1),(2,1),(1,0)
    s = move(s, 0, 2); s = move(s, 1, 2);
    s = move(s, 2, 2); s = move(s, 0, 1);
    s = move(s, 1, 3); s = move(s, 2, 1);
    s = move(s, 8, 8); s = move(s, 1, 0);
    const capture = play(s, 1, 1);
    expect(capture.ok).toBe(true);
    if (capture.ok) {
      expect(capture.captured).toBe(1);
      expect(play(capture.state, 1, 2)).toMatchObject({ ok: false, reason: expect.stringContaining("コウ") });
    }
  });
  it("ends after two consecutive passes and can resume", () => {
    const once = pass(newGame());
    expect(once.finished).toBe(false);
    const twice = pass(once);
    expect(twice.finished).toBe(true);
    expect(play(twice, 0, 0).ok).toBe(false);
    expect(resume(twice).finished).toBe(false);
    expect(move(once, 0, 0).passes).toBe(0);
  });
  it("returns a clearly provisional score", () => {
    const score = estimateScore(newGame());
    expect(score.neutral).toBe(81);
    expect(score.white).toBe(6.5);
  });
});
