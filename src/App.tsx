import { useState } from "react";
import { BOARD_SIZE, indexOf } from "./core/board";
import { estimateScore, newGame, pass, play, resume, type GameState } from "./core/game";

type Point = { row: number; col: number };
const label = (player: 1 | 2) => player === 1 ? "黒" : "白";

export default function App() {
  const [game, setGame] = useState<GameState>(newGame);
  const [selected, setSelected] = useState<Point | null>(null);
  const [message, setMessage] = useState("交点をタップして選択し、もう一度タップして確定");
  const [showScore, setShowScore] = useState(false);
  const score = showScore || game.finished ? estimateScore(game) : null;

  function tap(row: number, col: number) {
    if (game.finished) { setMessage("対局は終了しました。再開すると着手できます"); return; }
    if (game.board[indexOf(row, col)] !== 0) { setSelected(null); setMessage("すでに石があります"); return; }
    if (selected?.row === row && selected.col === col) {
      const result = play(game, row, col);
      if (!result.ok) { setMessage(result.reason); setSelected(null); return; }
      setGame(result.state);
      setSelected(null);
      setShowScore(false);
      setMessage(result.captured ? `${result.captured}子を取りました` : "着手しました");
    } else { setSelected({ row, col }); setMessage("同じ交点をもう一度タップすると確定"); }
  }
  function doPass() {
    if (game.finished) return;
    const next = pass(game);
    setGame(next);
    setSelected(null);
    setShowScore(false);
    setMessage(next.finished ? "双方が連続してパスしました。終局です" : `${label(game.toPlay)}がパスしました`);
  }
  return <main className="app"><header><h1>go9</h1><p>9路盤囲碁 — ルール実装版</p></header>
    <section className="panel"><p className="status">{game.finished ? "終局（連続2回パス）" : `手番：${game.toPlay === 1 ? "●" : "○"} ${label(game.toPlay)}`}　{game.moveNumber}手目</p>
      <div className="board" role="group" aria-label="9路盤">{Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE), col = i % BOARD_SIZE;
        const stone = game.board[i];
        const active = selected?.row === row && selected.col === col;
        return <button key={i} className={`point ${stone === 1 ? "black" : stone === 2 ? "white" : ""} ${active ? "selected" : ""}`}
          aria-label={`${row + 1}行${col + 1}列${stone ? ` ${label(stone)}石` : active ? " 選択中" : " 空点"}`}
          aria-pressed={active} onClick={() => tap(row, col)}><span className="stone" /></button>;
      })}</div>
      <p className="captures">取った石：黒 {game.captures[1]}子 ／ 白 {game.captures[2]}子</p>
      <p className="message" role="status">{message}</p>
      <div className="controls"><button onClick={doPass} disabled={game.finished}>パス</button>
        <button onClick={() => setShowScore(value => !value)}>{showScore ? "形勢表示を閉じる" : "形勢を確認"}</button>
        {game.finished && <button onClick={() => { setGame(resume(game)); setShowScore(false); setMessage("対局を再開しました"); }}>対局を再開</button>}
        <button className="reset" onClick={() => { setGame(newGame()); setSelected(null); setShowScore(false); setMessage("盤面を初期化しました"); }}>最初から</button></div>
      {score && <section className="score" aria-label="簡易形勢判断"><h2>簡易形勢判断（暫定）</h2>
        <p>黒：{score.black}目（地 {score.blackTerritory} ＋ アゲハマ {game.captures[1]}）</p>
        <p>白：{score.white}目（地 {score.whiteTerritory} ＋ アゲハマ {game.captures[2]} ＋ コミ 6.5）</p>
        <p>中立の空点：{score.neutral}</p>
        <strong>{score.winner === "tie" ? "同点" : `${score.winner === "black" ? "黒" : "白"}が${score.margin}目優勢`}</strong>
        <small>死石・セキ・ダメの正確な判定は未実装です。日本ルールの確定結果ではありません。</small>
      </section>}
    </section><footer>Phase 1 — 取り上げ・自殺手・単純コウ・パス・暫定形勢判断</footer></main>;
}
