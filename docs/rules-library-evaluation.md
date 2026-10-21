# go9: 囲碁ルール／採点ライブラリ調査（一次評価）

更新日: 2026-10-21

## 方針

- 9路盤・iPhone Safari・ブラウザ単体・現行React UIを維持。
- APIの入出力、判定精度、UI非依存性、テスト、ライセンスを**別軸**で評価する。
- 採用しない実装も、優れたロジックやテスト局面の参照候補として保持する。
- 日本囲碁規約の希少な例外より、通常対局での正しい勝敗判定を優先。
- 死活推定は不確実なので、最終採点ではグループ単位の手動修正と確認を残す。
- **AI対局には着手しない。**

## 一次候補

| 候補 | 主な用途 | API・UI分離 | 死石・セキ | ライセンス | 暫定評価 |
| --- | --- | --- | --- | --- | --- |
| [lightvector/goscorer](https://github.com/lightvector/goscorer) | 日本式の地の採点 | JS関数の入出力が明確。石の2次元配列・死石マスク・アゲハマ・コミを受け取る | 死石マスクは**入力**。セキの地の除外を支援 | MIT | **A: 採点処理の第一候補** |
| [online-go/goban](https://github.com/online-go/goban) | 着手ルール、対局状態、採点 | エンジン部分は分離されているが、ブラウザ向け配布との組み合わせ要検証 | 採点・死石管理の既存実装を調査 | Apache-2.0 | **B: 着手ルールの置換候補** |
| [aprescott/tenuki](https://github.com/aprescott/tenuki) | 着手、死石指定、地計算 | UI非依存のゲームエンジンを提供。APIはベータと明記 | 死石指定、セキ、地計算をうたう | MIT | **B: 統合候補・比較基準** |
| [online-go/score-estimator](https://github.com/online-go/score-estimator) | 形勢推定・死石候補 | C++→Emscripten JS。ビルド・バインディングの検証が必要 | 死石の候補推定。確定判定ではない | MIT | **B/C: 推定器の候補・参考実装** |

### 重要な区別

**goscorer は死石を自動検出するライブラリではない。** 呼び出し側が指定した死石情報をもとに、日本式の地・セキを考慮して採点する。したがって、goscorer単体で死活問題は解決しない。

**score-estimator は死石候補の推定器であり、正解を保証する裁定器ではない。** 自動候補を提示してユーザーが修正できるUIが必要。

## 推奨する組み合わせ（未確定）

1. **採点**: goscorer のJavaScript実装を小さなアダプター経由で利用。
2. **死石候補**: OGS score-estimator を別途PoCし、導入負荷と精度が妥当なら採用。
3. **着手ルール**: 現行の自作コードと goban / Tenuki をテスト局面で比較。依存・バンドルサイズ・API適合性を検証後に置換を判断。
4. **確定手続き**: 終局→死石候補表示→グループ単位の修正→採点確認。自動候補に不確実性があれば「未確定」と明示。

## go9側の境界（案）

```ts
type Color = 0 | 1 | 2;
type ScoringInput = {
  board: readonly Color[];          // 9×9, row-major
  deadStones: readonly boolean[];   // 同じ81点のマスク
  prisoners: { black: number; white: number };
  komi: number;
};
type ScoringOutput = {
  black: number;
  white: number;
  territory: readonly (0 | 1 | 2)[]; // 0=どちらの地でもない
  status: "provisional" | "confirmed";
};
```

このインターフェースは**go9側の設計案**であり、外部ライブラリのAPIそのものではない。

## 次の実装PRの受け入れ条件

- goscorer を利用した地計算の実装と、典型的なセキ・ダメ・死石の単体テスト。
- 死石のグループ指定・解除、終局後の再開、結果の未確定／確定の表示。
- 既存UIの2タップ着手を維持。
- ライブラリのライセンス表記と、実際に取り込んだバージョンを記録。
- テスト失敗・未対応局面があれば隠さず記載。
- 自動死活判定の完成をこのPRの必須条件にはしない（推定器は別PoC）。

## 一次資料

- https://github.com/lightvector/goscorer
- https://github.com/online-go/goban
- https://github.com/aprescott/tenuki
- https://github.com/online-go/score-estimator

## 追加調査: 自動死石判定（2026-10-21）

**結論**: 死石推定の既存実装は存在する。手動指定のみを最終形にしない。
まず実績のある **OGS score-estimator** と、明確なAPIを持つ **@sabaki/deadstones** を比較検証する。

| 候補 | 死石推定 | API/配布 | メモ |
| --- | --- | --- | --- |
| [@sabaki/deadstones](https://github.com/SabakiHQ/deadstones) | モンテカルロによる死石候補推定 | `guess(board, { finished, iterations }) -> Promise<[x,y][]>`。npm ESM、ブラウザWASM（`useFetch`設定） | **最初のPoC候補**。APIが明確。MIT。確率的推定なので誤判定あり |
| [OGS score-estimator](https://github.com/online-go/score-estimator) | 実際のOGSで使われる死石除去提案 | C++ / Emscripten JS。JSバインディングを調査してアダプター化 | **比較基準**。MIT。実運用実績が強み |
| [Sagebati/goban](https://github.com/Sagebati/goban) | `deadstones`オプション（実験的） | Rust crate。ブラウザ導入は追加検証 | **参考候補**。README上「境界が閉じた場合のみ」 |
| [goscorer](https://github.com/lightvector/goscorer) | 死石推定はしない | 死石マスクを入力し日本式の地を採点 | **推定後の採点**を担当 |

### 死石推定と採点の分離

```text
盤面 → 死石推定器（Sabaki / OGS）→ 死石候補の座標群
                                    ↓
                          グループ単位で確認・修正
                                    ↓
                    goscorer（地・セキ・ダメの採点）
                                    ↓
                         暫定／確認済みの結果
```

推定器が返すのは**候補**であって日本囲碁規約における最終裁定ではない。推定器の精度を通常の9路盤終局局面で比較し、明らかな誤判定を防ぐ。

### 次のPoC受け入れ条件

1. `@sabaki/deadstones` の9路盤入力・座標出力を既存の81点配列に変換する純粋なアダプターを用意。
2. Viteのビルド・GitHub Pages配下のWASM配信・iPhone Safariでの初期化を検証。
3. OGS推定器にも同一のテスト局面を入力し、推定結果を比較。
4. 典型的な死石、二眼の生き、セキ、未確定局面をテスト。推定器が異なる局面は**要確認**として扱う。
5. 自動候補の表示と手動修正を用意。判定不能時は「未確定」を表示し、勝敗を断定しない。
6. MITライセンスの著作権表示と利用バージョンを記録。

**優先順位変更**: 死石自動推定を先行PoCの必須対象とする。採点だけを実装して完了扱いにはしない。
