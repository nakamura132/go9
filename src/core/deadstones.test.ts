import { describe, expect, it, vi } from "vitest";
import { emptyBoard, indexOf, type Stone } from "./board";
import { estimateDeadStones, fromSabakiVertices, toSabakiBoard } from "./deadstones";

describe("Sabaki dead stone adapter", () => {
  const board = [...emptyBoard()] as Stone[];
  board[indexOf(2, 3)] = 1;
  board[indexOf(4, 5)] = 2;
  it("converts colors and coordinates without transposition", () => {
    const converted = toSabakiBoard(board);
    expect(converted[2][3]).toBe(1);
    expect(converted[4][5]).toBe(-1);
    expect(converted[3][2]).toBe(0);
  });
  it("maps guessed [x,y] to a row-major mask", async () => {
    const guess = vi.fn(async () => [[5, 4]] as const);
    const result = await estimateDeadStones(board, guess, 200);
    expect(guess).toHaveBeenCalledWith(toSabakiBoard(board), { finished: true, iterations: 200 });
    expect(result.dead[indexOf(4, 5)]).toBe(true);
    expect(result.dead[indexOf(2, 3)]).toBe(false);
    expect(result.status).toBe("estimated");
  });
  it("rejects out-of-board and empty coordinates", () => {
    expect(() => fromSabakiVertices(board, [[9, 0]])).toThrow(RangeError);
    expect(() => fromSabakiVertices(board, [[0, 0]])).toThrow(RangeError);
    expect(() => fromSabakiVertices(board, [[1.5, 0]])).toThrow(RangeError);
  });
  it("rejects incorrect board dimensions", () => {
    expect(() => toSabakiBoard([0, 0])).toThrow(RangeError);
  });
});
