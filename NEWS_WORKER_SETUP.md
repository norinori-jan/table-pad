# table-pad ニュース専用 Worker 設定

## 構成

GitHub Pages の table-pad から Cloudflare Worker を呼び出し、Worker が GDELT DOC API に接続します。

- 公開元: `https://norinori-jan.github.io`
- Worker: `news-worker.js`
- 設定: `wrangler.news.toml`
- Durable Object: `NewsRateLimiter`（全利用者で共有する1つのゲート）
- GDELTへの要求間隔: Durable Object内で最低5秒
- GDELTが429を返した場合: 全端末共通で最低60秒のクールダウンを保存し、再試行を抑止
- Workerの応答: `title / url / domain / seendate` のみ。画像・記事本文・SNSメタデータは返しません。
- 既存保存キー `tpNewsLite.v2`、日次使用量キー、上限設定は維持します。

## Cloudflareへの初回公開

Node.js と Wrangler が使える環境で、table-pad リポジトリのルートから実行します。

```sh
npx wrangler login
npx wrangler deploy --config wrangler.news.toml
```

初回デプロイ時に Durable Object の SQLite migration が適用されます。デプロイ完了時に表示される `https://table-pad-news.<アカウント>.workers.dev` を控えます。

## table-pad 側の設定

1. GitHub Pages にこのブランチの変更を反映する（現在の `main` には未反映）。
2. table-pad の「低通信量・世界ニュース見張り網」を開く。
3. 「ニュースWorker URL」にデプロイ時の `workers.dev` URL を入力。
4. 「接続先を保存」を押す。
5. 「見出しを取得」を押す。

Worker URLは端末の localStorage に保存されます。各端末で初回だけ設定してください。

## 動作確認

- OPTIONS preflight が 204 になること。
- GitHub Pages Origin の POST が JSON を返すこと。
- 別Originからのブラウザー呼び出しが拒否されること。
- 連続POSTは2回目が 429 となり、`Retry-After` が返ること。
- GDELT自体が429を返した場合、Workerが全端末共通のクールダウンを開始し、次の要求にも待機時間を返すこと。
- GDELTがレート制限文や不正JSONを返した場合、記事として保存されないこと。
- 正常応答は4項目だけになり、既存 `tpNewsLite.v2` に保存されること。

## 制限・注意

- Origin制限はブラウザー向けCORS制御であり、秘密鍵による認証ではありません。curl等でOriginを偽装する利用者までは排除できません。
- Durable ObjectはWorker経由の要求間隔とGDELTの429後のクールダウンを全端末で共有しますが、GDELT側の共有IP判定・追加制限を解除するものではありません。
- 取得できない場合はWorkerのレスポンス本文とCloudflare Logsを確認してください。GDELTに対して連続再試行しないでください。
- この変更は `fix/news-compare-integration` ブランチ上です。mainへのマージや公開設定変更は行っていません。
