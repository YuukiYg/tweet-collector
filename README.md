# Twitter Data Collector

ブラウザで Twitter/X のタイムラインを表示しながら、投稿データを自動収集して CSV/JSON でダウンロードできる JavaScript ツールです。

## 機能

- タイムラインをスクロールするだけで投稿データを自動収集
- 重複データの自動除去
- 特定のアカウントのみを収集するフィルター機能
- CSV・JSON 形式でのデータダウンロード
- 日本時間での時刻表示

## 収集データ

以下の項目を取得できます：

- 投稿日時（日本時間、YYYY-MM-DD HH:mm:ss 形式）
- ユーザー ID
- いいね数
- リツイート数
- リプライ数
- インプレッション数（表示回数）
- ツイート ID
- **返信先ユーザー名** (replyToWho)
- **返信先ツイートID** (replyToWhichId) ※HTMLから取得不可のため空文字
- **メディア有無** (hasMedia) - 画像・動画の有無を 1/0 で表示
- **引用元ユーザー名** (repostToWho)
- **引用元ツイートID** (repostToWhichId)
- 投稿内容

## 使用方法

### 1. ブラウザのコンソールで実行

1. Chrome/Firefox で Twitter/X を開く
2. 開発者ツールを開く（F12 キー）
3. コンソールタブを選択
4. JavaScript コードを貼り付けて実行
5. タイムラインを手動でスクロール
6. データをダウンロード

```javascript
// 収集件数を確認
tweets.length

// CSVでダウンロード
downloadTweetsCSV()

// JSONでダウンロード
downloadTweetsJSON()

2. 特定アカウントのみを収集

コードの上部にある TARGET_USER_ID を設定：

// 特定のアカウントのみ収集
const TARGET_USER_ID = 'YuukiYg';

// 全アカウント収集（デフォルト）
const TARGET_USER_ID = null;

3. ブラウザ拡張機能として使用

manifest.json:
{
  "manifest_version": 3,
  "name": "Twitter Data Collector",
  "version": "1.0",
  "permissions": ["activeTab"],
  "content_scripts": [{
    "matches": ["*://twitter.com/*", "*://x.com/*"],
    "js": ["content.js"]
  }]
}

content.js にメインのJavaScriptコードを配置。

4. Tampermonkey/Greasemonkey

// ==UserScript==
// @name         Twitter Data Collector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // メインのJavaScriptコードをここに貼り付け
})();

技術仕様

主要な技術

- MutationObserver API: DOM変更の監視
- querySelector: HTML要素の取得
- Blob API: ファイルデータの生成
- URL.createObjectURL: ダウンロードリンクの生成

動作原理

1. MutationObserverでタイムラインのDOM変更を監視
2. 新しいツイート要素が追加されると自動で検出
3. 各種データ（いいね数、投稿内容など）を抽出
4. 重複チェック後、配列に保存
5. ユーザーの要求でCSV/JSON形式でダウンロード

出力形式

CSV形式

投稿日時,ユーザーID,いいね数,リツイート数,リプ数,インプ数,ID,replyToWho,replyToWhichId,hasMedia,repostToWho,repostToWhichId,投稿内容
2024-08-11 14:30:25,YuukiYg,150,25,10,5000,1111111111111111111,,,0,,,"オリジナル投稿のサンプル"
2024-08-11 15:20:10,user_a,200,30,5,8000,2222222222222222222,YuukiYg,,0,,,"YuukiYgへの返信"
2024-08-11 16:10:30,user_b,100,15,2,3000,3333333333333333333,,,1,YuukiYg,1111111111111111111,"引用ツイート（画像付き）"

JSON形式

[
  {
    "datetime": "2024-08-11 14:30:25",
    "userId": "YuukiYg",
    "likes": 150,
    "retweets": 25,
    "replies": 10,
    "views": 5000,
    "id": "1111111111111111111",
    "replyToWho": "",
    "replyToWhichId": "",
    "hasMedia": 0,
    "repostToWho": "",
    "repostToWhichId": "",
    "text": "オリジナル投稿のサンプル",
    "url": "https://x.com/YuukiYg/status/1111111111111111111",
    "timestamp": "2024-08-11T05:30:25.000Z"
  },
  {
    "datetime": "2024-08-11 15:20:10",
    "userId": "user_a",
    "likes": 200,
    "retweets": 30,
    "replies": 5,
    "views": 8000,
    "id": "2222222222222222222",
    "replyToWho": "YuukiYg",
    "replyToWhichId": "",
    "hasMedia": 0,
    "repostToWho": "",
    "repostToWhichId": "",
    "text": "YuukiYgへの返信",
    "url": "https://x.com/user_a/status/2222222222222222222",
    "timestamp": "2024-08-11T06:20:10.000Z"
  }
]

注意事項

制限事項

- ブックマーク数は取得不可（Twitter仕様により非公開）
- 全投稿の取得は不可（APIの制限により数千件程度が上限）
- リアルタイム取得のみ（過去の投稿は表示された分のみ）
- **返信先ツイートID (replyToWhichId) は取得不可**（Twitter/XはHTMLにこの情報を出力していません）
- 引用ツイートの検出は「引用」というテキストに依存（英語環境では動作しない可能性があります）

使用上の注意

- Twitter/Xの利用規約を遵守してください
- 大量データ収集時はサーバー負荷を考慮し、適度な間隔を空けてください
- 収集したデータの取り扱いには十分注意してください
- 個人情報保護法等の関連法令を遵守してください

トラブルシューティング

データが収集されない場合

1. 開発者ツールのコンソールでエラーが出ていないか確認
2. Twitter/XのUI変更により要素のセレクタが変わった可能性
3. ブラウザの設定でJavaScriptが無効になっていないか確認

ダウンロードできない場合

1. ブラウザのダウンロードブロック設定を確認
2. tweets.lengthで収集データがあるか確認
3. ポップアップブロッカーの設定を確認

ライセンス

このツールは教育・研究目的での使用を想定しています。商用利用や大量データ収集を行う場合は、Twitter APIの利用を検討してください。
```
