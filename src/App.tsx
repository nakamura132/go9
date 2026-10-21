import { useState } from "react";
import { exportSgf, importSgf } from "./core/sgf";
import { formatTextBoard } from "./core/textBoard";
import { estimateDeadStones } from "./core/deadstones";
import { guessDeadStones } from "./core/sabaki";
import { BOARD_SIZE, indexOf } from "./core/board";
import { estimateScore, newGame, pass, play, resume, type GameState } from "./core/game";

declare const __APP_VERSION__: string;
type Point = { row: number; col: number };
const label = (player: 1 | 2) => player === 1 ? "黒" : "白";

export default function App() {
  const [game, setGame] = useState<GameState>(newGame);
  const [selected, setSelected] = useState<Point | null>(null);
  const [message, setMessage] = useState("交点をタップして選択し、もう一度タップして確定");
  const [showScore, setShowScore] = useState(false);
  const [dead, setDead] = useState<readonly boolean[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [sgfText, setSgfText] = useState("");
  const [sgfOpen, setSgfOpen] = useState(false);
  const [deadMessage, setDeadMessage] = useState("");
  const deadBlack = dead?.reduce((n, value, i) => n + (value && game.board[i] === 1 ? 1 : 0), 0) ?? 0;
  const deadWhite = dead?.reduce((n, value, i) => n + (value && game.board[i] === 2 ? 1 : 0), 0) ?? 0;
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
      setDead(null);
      setDeadMessage("");
      setMessage(result.captured ? `${result.captured}子を取りました` : "着手しました");
    } else { setSelected({ row, col }); setMessage("同じ交点をもう一度タップすると確定"); }
  }
  function doPass() {
    if (game.finished) return;
    const next = pass(game);
    setGame(next);
    setSelected(null);
    setShowScore(false);
    setDead(null);
    setDeadMessage("");
    setMessage(next.finished ? "双方が連続してパスしました。終局です" : `${label(game.toPlay)}がパスしました`);
  }
  async function checkDead() {
    if (busy) return;
    setBusy(true);
    setDead(null);
    setDeadMessage("Sabakiの死石推定を実行中…");
    try {
      const result = await estimateDeadStones(game.board, guessDeadStones, 100);
      setDead(result.dead);
      setDeadMessage("推定が完了しました。盤上の×印と色別の集計をご確認ください。確定判定ではありません。");
    } catch (error) {
      setDeadMessage(`死石推定に失敗しました：${error instanceof Error ? error.message : String(error)}`);
    } finally { setBusy(false); }
  }
  async function copyTextBoard() {
    const value = formatTextBoard(game.board, dead, game.toPlay);
    try {
      await navigator.clipboard.writeText(value);
      setMessage("テキスト碁盤をコピーしました。このチャットに貼り付けられます");
    } catch {
      setSgfText(value);
      setSgfOpen(true);
      setMessage("自動コピーできませんでした。表示されたテキストを長押ししてコピーしてください（SGFではありません）");
    }
  }
  async function copySgf() {
    const value = exportSgf(game, dead);
    setSgfText(value);
    setSgfOpen(true);
    try {
      await navigator.clipboard.writeText(value);
      setMessage("SGFをコピーしました。このチャットに貼り付けられます");
    } catch {
      setMessage("自動コピーできませんでした。下のテキストを長押ししてコピーしてください");
    }
  }
  function loadSgf() {
    try {
      const loaded = importSgf(sgfText.trim());
      setGame(loaded.game);
      setDead(loaded.dead);
      setSelected(null);
      setShowScore(false);
      setDeadMessage(loaded.dead ? "SGFの×印を復元しました（死石候補）" : "");
      setMessage("SGFの盤面を復元しました。着手履歴・アゲハマは復元されません");
    } catch (error) {
      setMessage("SGF読み込み失敗：" + (error instanceof Error ? error.message : String(error)));
    }
  }
  return <main className="app"><header><h1>go9 <span className="version">v{__APP_VERSION__}</span></h1><p>9路盤囲碁 — ルール実装版</p></header>
    <section className="panel"><p className="status">{game.finished ? "終局（連続2回パス）" : `手番：${game.toPlay === 1 ? "●" : "○"} ${label(game.toPlay)}`}　{game.moveNumber}手目</p>
      <div className="board" role="group" aria-label="9路盤">{Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE), col = i % BOARD_SIZE;
        const stone = game.board[i];
        const active = selected?.row === row && selected.col === col;
        return <button key={i} className={`point ${dead?.[i] ? "dead-candidate" : ""} ${stone === 1 ? "black" : stone === 2 ? "white" : ""} ${active ? "selected" : ""}`}
          aria-label={`${row + 1}行${col + 1}列${stone ? ` ${label(stone)}石${dead?.[i] ? " 死石候補" : ""}` : active ? " 選択中" : " 空点"}`}
          aria-pressed={active} onClick={() => tap(row, col)}><span className="stone" />{dead?.[i] && <span className="dead-mark" aria-hidden="true">×</span>}</button>;
      })}</div>
      <p className="captures">取った石：黒 {game.captures[1]}子 ／ 白 {game.captures[2]}子</p>
      <p className="message" role="status">{message}</p>
      {deadMessage && <p className="dead-message" role="status">{deadMessage}</p>}
      {dead && <p className="dead-count" role="status">死石候補：<strong>黒 {deadBlack}子 ／ 白 {deadWhite}子</strong>{deadBlack + deadWhite === 0 ? "（候補なし）" : ""}</p>}
      <div className="controls"><button onClick={doPass} disabled={game.finished}>パス</button>
        <button onClick={checkDead} disabled={busy}>{busy ? "推定中…" : "死石を自動推定"}</button>
        <button onClick={copyTextBoard}>テキスト碁盤コピー</button>
        <button onClick={copySgf}>SGFコピー</button>
        <button onClick={() => setSgfOpen(value => !value)}>SGF貼り付け</button>
        <button onClick={() => setShowScore(value => !value)}>{showScore ? "形勢表示を閉じる" : "形勢を確認"}</button>
        {game.finished && <button onClick={() => { setGame(resume(game)); setShowScore(false); setDead(null); setDeadMessage(""); setMessage("対局を再開しました"); }}>対局を再開</button>}
        <button className="reset" onClick={() => { setGame(newGame()); setSelected(null); setShowScore(false); setDead(null); setDeadMessage(""); setMessage("盤面を初期化しました"); }}>最初から</button></div>
      {sgfOpen && <section className="sgf-panel" aria-label="SGFの共有"><label htmlFor="sgf-text">SGFテキスト（長押しでコピー／貼り付け）</label>
        <textarea id="sgf-text" value={sgfText} onChange={e => setSgfText(e.target.value)} rows={5} spellCheck={false} />
        <button onClick={loadSgf}>このSGFを読み込む</button>
        <small>現在の盤面・手番・×印を保存します。棋譜履歴・アゲハマは含まれません。読み込み時は現在の対局を置き換えます。</small>
      </section>}
      {score && <section className="score" aria-label="簡易形勢判断"><h2>簡易形勢判断（暫定）</h2>
        <p>黒：{score.black}目（地 {score.blackTerritory} ＋ アゲハマ {game.captures[1]}）</p>
        <p>白：{score.white}目（地 {score.whiteTerritory} ＋ アゲハマ {game.captures[2]} ＋ コミ 6.5）</p>
        <p>中立の空点：{score.neutral}</p>
        <strong>{score.winner === "tie" ? "同点" : `${score.winner === "black" ? "黒" : "白"}が${score.margin}目優勢`}</strong>
        <small>死石・セキ・ダメの正確な判定は未実装です。日本ルールの確定結果ではありません。</small>
      </section>}
    </section><footer>死石の自動推定は試験機能です。勝敗計算への反映は今後実装</footer></main>;
}
