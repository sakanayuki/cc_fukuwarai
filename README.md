# ふくわらい

3歳児向けの「福笑い」Webアプリ。みかん・りんご・お皿などの写真に、目・まゆ・はな・くちのシールを貼って顔を作ります。
スマホ(縦・横)向け。スマホを傾けると、選んでいるパーツも傾きます(ジャイロ)。

## あそび方

1. 「はじめる」→ 顔を作る土台を選ぶ
2. 下のトレイのタブ(目・まゆ・はな・くち)からパーツをタップして「選択中」にする
3. 土台をタップして貼る(スマホを傾けると、その角度で貼れる)
4. 貼ったパーツをタップすると剥がれて「選択中」に戻る。赤い ✕ で選択をやめる(トレイへ戻す)
5. 「できた！」で紙吹雪。PNG 保存は任意

## 開発

```sh
npm install
npm run dev      # 開発サーバー
npm test         # 単体テスト
npm run build    # dist/ に本番ビルド
```

ジャイロは HTTPS(または localhost)でのみ動きます。GitHub Pages は HTTPS なのでそのまま動作します。
iPhone では「はじめる」ボタンのタップをきっかけに、モーションセンサーの許可ダイアログが出ます。

## 土台を追加する

`src/assets/bases/` に **正方形(1:1)** の画像(jpg / png / webp)を置くだけで、土台えらびに増えます。
並び順はファイル名順です(`01-...`, `02-...` のように番号を付けると制御しやすい)。

## パーツの大きさを調整する

`src/data/config.ts` の `CATEGORIES[].scale` で、カテゴリごとの倍率を変えられます。
基準は「元シート台紙の実寸比」(台紙の幅に対するパーツ幅の割合 = 土台の幅に対する割合)です。

貼ったあとも同じパーツを持ち続けたい場合は `KEEP_HOLDING_AFTER_PASTE` を `true` にします。

## パーツ素材の作り直し

素材のシール台紙(`tools/source/*.jpg`)から、1個ずつ透過 WebP に切り出しています(生成物は `public/parts/` に置いてコミット済み)。
切り出し方を変えたい場合だけ実行してください。

```sh
pip install pillow numpy scipy
python tools/slice_sheets.py
```

目とまゆは左右のセットで真横に並べて表示します。セットの相手がいないパーツは自動で削除されます
(読み順で隣り合う2つの鏡像の一致度で判定。縦並びなどで判定できないセットは `EXTRA_PAIRS` で指定)。

## 公開(GitHub Pages)

`main` ブランチへの push で GitHub Actions(`.github/workflows/deploy.yml`)がビルドして Pages に公開します。
初回だけ、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にしてください。

ビルドは相対パス(`base: './'`)なので、`https://<user>.github.io/<repo>/` のサブパスでも動きます。
