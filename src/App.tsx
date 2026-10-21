import { useState } from "react";

type Point = { row: number; col: number };
const SIZE = 9;

export default function App() {
  const [selected, setSelected] = useState<Point | null>(null);
  const [stones, setStones] = useState<Record<string, "black" | "white">>({});
  const [turn, setTurn] = useState<"black" | "white">("black");
  const [message, setMessage] = useState("交点をタップして選択し、もう一度タップして確定");
  function tap(row: number, col: number) {
    const key = `${row}-${col}`;
    if (stones[key]) { setMessage("すでに石があります"); return; }
    if (selected?.row === row && selected.col === col) {
      setStones(previous => ({ ...previous, [key]: turn }));
      setTurn(previous => previous === "black" ? "white" : "black");
      setSelected(null);
      setMessage("着手しました（現在はUI試作で、囲碁ルールは未実装です）");
    } else { setSelected({ row, col }); setMessage("同じ交点をもう一度タップすると確定"); }
  }
  return <main className="app"><header><h1>go9</h1><p>9路盤囲碁 — UIプロトタイプ</p></header>
    <section className="panel"><p className="status">手番：{turn === "black" ? "● 黒" : "○ 白"}</p>
      <div className="board" role="group" aria-label="9路盤">{Array.from({length: SIZE * SIZE}, (_, i) => {
        const row = Math.floor(i / SIZE), col = i % SIZE;
        const stone = stones[`${row}-${col}`];
        const active = selected?.row === row && selected.col === col;
        return <button key={i} className={`point ${stone ?? ""} ${active ? "selected" : ""}`} aria-label={`${row + 1}行${col + 1}列${stone ? ` ${stone === "black" ? "黒" : "白"}石` : active ? " 選択中" : " 空点"}`} aria-pressed={active} onClick={() => tap(row,col)}><span className="stone" /></button>;
      })}</div>
      <p className="message" role="status">{message}</p><button className="reset" onClick={() => { setStones({}); setSelected(null); setTurn("black"); setMessage("盤面を初期化しました"); }}>盤面をリセット</button>
    </section><footer>Phase 0 — ルール・AI・終局判定は今後実装</footer></main>;
}
