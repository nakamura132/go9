import { BOARD_SIZE, type Board } from "./board";

const COLUMNS = "ABCDEFGHI";

/** A compact, human-readable board snapshot; rows count from top to bottom. */
export function formatTextBoard(board: Board, dead: readonly boolean[] | null, toPlay: 1 | 2): string {
  if (board.length !== BOARD_SIZE * BOARD_SIZE) throw new RangeError("9路盤が必要です");
  const lines = ["   " + [...COLUMNS].join(" ")];
  let black = 0, white = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    const cells: string[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const i = row * BOARD_SIZE + col;
      const stone = board[i];
      if (stone === 1 && dead?.[i]) { cells.push("◆"); black++; }
      else if (stone === 2 && dead?.[i]) { cells.push("◇"); white++; }
      else cells.push(stone === 1 ? "●" : stone === 2 ? "○" : ".");
    }
    lines.push(String(row + 1).padStart(2, " ") + " " + cells.join(" "));
  }
  lines.push("手番: " + (toPlay === 1 ? "黒" : "白"));
  lines.push("死石候補: 黒 " + black + "子 / 白 " + white + "子");
  lines.push("凡例: ●=黒 ○=白 ◆=黒の死石候補 ◇=白の死石候補 .=空点");
  return lines.join("\n");
}
