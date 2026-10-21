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
