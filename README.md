# go9

スマートフォン向け9路盤囲碁アプリ。サーバー不要のブラウザ実行を目指します。

## 開発

```bash
npm install
npm run dev
npm test
npm run build
```

## 現在の状態

- 9路盤のタッチUI試作（同じ交点を2回タップして確定）
- 合法手、取り上げ、コウ、終局判定、AIは未実装
- CI: VitestとTypeScript/Viteビルド

## 方針

- React + TypeScript + Vite
- 日本ルール、最大9路盤、棋力選択式
- ブラウザ内AI（Web Worker予定）
- サーバーなし
