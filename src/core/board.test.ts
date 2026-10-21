import { describe, expect, it } from "vitest";
import { emptyBoard, indexOf } from "./board";
describe("board foundation", () => { it("creates a 9x9 empty board", () => { expect(emptyBoard()).toHaveLength(81); expect(emptyBoard().every(s => s === 0)).toBe(true); }); it("maps intersections to indices", () => { expect(indexOf(8, 8)).toBe(80); expect(() => indexOf(9, 0)).toThrow(); }); });
