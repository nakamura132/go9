export type Stone = 0 | 1 | 2;
export type Board = readonly Stone[];
export const BOARD_SIZE = 9;
export function emptyBoard(size = BOARD_SIZE): Board { if (!Number.isInteger(size) || size < 2 || size > 9) throw new Error("Invalid board size"); return Array<Stone>(size * size).fill(0); }
export function indexOf(row: number, col: number, size = BOARD_SIZE): number { if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= size || col >= size) throw new RangeError("Invalid point"); return row * size + col; }
