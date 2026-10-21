import { describe, expect, it } from "vitest";
import { formatTextBoard } from "./textBoard";
describe("text board sharing", () => {
  it("shows letter columns, numeric rows and candidate marks", () => {
    const board = Array(81).fill(0);
    board[0] = 1; board[10] = 2;
    const dead = Array(81).fill(false); dead[0] = true; dead[10] = true;
    const text = formatTextBoard(board, dead, 2);
    expect(text).toContain("A B C D E F G H I");
    expect(text).toContain(" 1 ◆");
    expect(text).toContain(" 2 . ◇");
    expect(text).toContain("手番: 白");
    expect(text).toContain("黒 1子 / 白 1子");
  });
  it("shows no dead marks when not estimated", () => {
    expect(formatTextBoard(Array(81).fill(0), null, 1)).toContain("黒 0子 / 白 0子");
  });
});
