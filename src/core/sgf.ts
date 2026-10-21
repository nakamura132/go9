import { parse, stringify } from "@sabaki/sgf";
import { BOARD_SIZE, type Board, type Stone } from "./board";
import { newGame, type GameState } from "./game";

type Node = { data: Record<string, string[]>; children: Node[] };
const coord = (i: number) => String.fromCharCode(97 + i % BOARD_SIZE) + String.fromCharCode(97 + Math.floor(i / BOARD_SIZE));
function point(s: string): number {
  if (!/^[a-i]{2}$/.test(s)) throw new Error("9路盤外または不正な座標: " + s);
  return (s.charCodeAt(1) - 97) * BOARD_SIZE + s.charCodeAt(0) - 97;
}
function expand(values: string[]): number[] {
  const out: number[] = [];
  for (const value of values) {
    if (!value.includes(":")) { out.push(point(value)); continue; }
    const parts = value.split(":");
    if (parts.length !== 2) throw new Error("不正な座標範囲");
    const a = point(parts[0]), b = point(parts[1]);
    const ax = a % 9, ay = Math.floor(a / 9), bx = b % 9, by = Math.floor(b / 9);
    if (ax > bx || ay > by) throw new Error("不正な座標範囲");
    for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) out.push(y * 9 + x);
  }
  return out;
}
/** SGF FF[4] snapshot. MA marks are treated as candidate marks only when on stones. */
export function exportSgf(state: GameState, dead: readonly boolean[] | null): string {
  const data: Record<string, string[]> = {
    FF: ["4"], GM: ["1"], CA: ["UTF-8"], SZ: ["9"], KM: ["6.5"], AP: ["go9:0.3.0"],
    PL: [state.toPlay === 1 ? "B" : "W"]
  };
  const black: string[] = [], white: string[] = [], marks: string[] = [];
  state.board.forEach((stone, i) => {
    if (stone === 1) black.push(coord(i));
    if (stone === 2) white.push(coord(i));
    if (stone !== 0 && dead?.[i]) marks.push(coord(i));
  });
  if (black.length) data.AB = black;
  if (white.length) data.AW = white;
  if (marks.length) data.MA = marks;
  return stringify([{ data, children: [] }], { linebreak: "" });
}
/** Imports the final position of the main line. Capture counts/history cannot be recovered from a snapshot. */
export function importSgf(text: string): { game: GameState; dead: readonly boolean[] | null } {
  if (text.length > 250_000) throw new Error("SGFが大きすぎます");
  const trees = parse(text) as Node[];
  if (trees.length !== 1 || !trees[0]?.data) throw new Error("SGFは棋譜1件を指定してください");
  const root = trees[0].data;
  if (root.GM?.[0] !== "1" || root.SZ?.[0] !== "9") throw new Error("囲碁の9路盤SGFのみ対応しています");
  const board = Array<Stone>(81).fill(0), marks = Array<boolean>(81).fill(false);
  let node: Node | undefined = trees[0];
  let toPlay: 1 | 2 = 1;
  let steps = 0;
  while (node) {
    const d = node.data;
    for (const [key, stone] of [["AE", 0], ["AB", 1], ["AW", 2]] as const) {
      for (const i of expand(d[key] ?? [])) board[i] = stone as Stone;
    }
    if (d.B && d.W) throw new Error("同一ノードに黒白の着手があります");
    for (const [key, stone] of [["B", 1], ["W", 2]] as const) {
      if (!d[key]) continue;
      if (d[key].length !== 1) throw new Error("不正な着手");
      const value = d[key][0];
      if (value) {
        const i = point(value);
        if (board[i] !== 0) throw new Error("着手先に石があります");
        board[i] = stone;
        // A move record requires capture handling. Reject it rather than silently corrupting a position.
        throw new Error("着手履歴付きSGFの読み込みは未対応です。AB/AWで盤面を記録したSGFを指定してください");
      }
      toPlay = stone === 1 ? 2 : 1;
    }
    if (d.PL) {
      if (d.PL.length !== 1 || !["B", "W"].includes(d.PL[0])) throw new Error("不正な手番");
      toPlay = d.PL[0] === "B" ? 1 : 2;
    }
    if (d.MA) for (const i of expand(d.MA)) marks[i] = true;
    if (node.children.length > 1) throw new Error("分岐付きSGFは未対応です");
    node = node.children[0];
    if (++steps > 10000) throw new Error("SGFが長すぎます");
  }
  for (let i = 0; i < 81; i++) if (!board[i]) marks[i] = false;
  return { game: { ...newGame(), board, toPlay }, dead: marks.some(Boolean) ? marks : null };
}
