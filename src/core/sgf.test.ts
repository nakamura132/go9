import { describe, expect, it } from "vitest";
import { exportSgf, importSgf } from "./sgf";
import { newGame } from "./game";
describe("SGF position sharing", () => {
  it("roundtrips board, turn and marked stones", () => {
    const game = { ...newGame(), board: Array.from({length:81}, (_,i) => i===0 ? 1 as const : i===10 ? 2 as const : 0 as const), toPlay: 2 as const };
    const dead = Array(81).fill(false); dead[10]=true;
    const loaded = importSgf(exportSgf(game, dead));
    expect(loaded.game.board).toEqual(game.board);
    expect(loaded.game.toPlay).toBe(2);
    expect(loaded.dead?.[10]).toBe(true);
  });
  it("rejects wrong board size", () => expect(() => importSgf("(;FF[4]GM[1]SZ[19])")).toThrow());
  it("rejects invalid coordinates", () => expect(() => importSgf("(;FF[4]GM[1]SZ[9]AB[zz])")).toThrow());
  it("imports a standard setup position", () => {
    const loaded = importSgf("(;FF[4]GM[1]SZ[9]AB[aa][bb]AW[cc]PL[W]MA[bb])");
    expect(loaded.game.board[0]).toBe(1);
    expect(loaded.game.board[10]).toBe(1);
    expect(loaded.game.board[20]).toBe(2);
    expect(loaded.dead?.[10]).toBe(true);
  });
});
