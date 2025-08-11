// 収集済みツイートのIDを追跡
const collectedTweetIds = new Set();
const tweets = [];

function extractTweetData(node) {
  // ツイートIDを取得
  const tweetLink = node.querySelector('a[href*="/status/"]');
  if (!tweetLink) return null;

  const tweetId = tweetLink.href.match(/\/status\/(\d+)/)?.[1];
  if (!tweetId || collectedTweetIds.has(tweetId)) return null;

  // 各種データを抽出
  const textElement = node.querySelector('[data-testid="tweetText"]');
  const timeElement = node.querySelector("time");

  // エンゲージメント数値を抽出
  const likeElement = node.querySelector('[data-testid="like"]');
  const retweetElement = node.querySelector('[data-testid="retweet"]');
  const replyElement = node.querySelector('[data-testid="reply"]');
  const bookmarkElement = node.querySelector('[data-testid="bookmark"]');

  // 数値を抽出する関数
  function extractCount(element) {
    if (!element) return 0;
    const text =
      element.getAttribute("aria-label") || element.textContent || "";
    const match = text.match(/(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, "")) : 0;
  }

  // インプレッション数（views）を取得
  const viewElement =
    node.querySelector('a[href*="/analytics"]') ||
    node.querySelector('[data-testid="app-text-transition-container"]');

  return {
    datetime: timeElement?.getAttribute("datetime") || "",
    likes: extractCount(likeElement),
    retweets: extractCount(retweetElement),
    replies: extractCount(replyElement),
    views: extractCount(viewElement) || 0,
    bookmarks: extractCount(bookmarkElement),
    text: textElement?.innerText || "",
    id: tweetId,
    url: tweetLink.href,
    timestamp: new Date().toISOString(),
  };
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.querySelector('[data-testid="tweet"]')) {
        const tweetData = extractTweetData(node);
        if (tweetData) {
          tweets.push(tweetData);
          collectedTweetIds.add(tweetData.id);
          console.log(`新しい投稿 (${tweets.length}件目): ${tweetData.likes}♥ ${tweetData.retweets}🔄 ${tweetData.replies}💬
  ${tweetData.bookmarks}🔖`);
        }
      }
    });
  });
});

// 監視開始
observer.observe(document.body, { childList: true, subtree: true });

// CSVファイルとしてダウンロード（修正版）
function downloadTweetsCSV() {
  if (tweets.length === 0) {
    console.log("ダウンロードするデータがありません");
    return;
  }

  const headers = [
    "投稿日時",
    "いいね数",
    "リツイート数",
    "リプ数",
    "インプ数",
    "ブックマーク数",
    "投稿内容",
  ];
  const csvRows = [headers.join(",")];

  tweets.forEach((t) => {
    const cleanText = (t.text || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, " ");
    const row = [
      t.datetime || "",
      t.likes || 0,
      t.retweets || 0,
      t.replies || 0,
      t.views || 0,
      t.bookmarks || 0,
      `"${cleanText}"`,
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const dataBlob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `iiGIANT_tweets_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`${tweets.length}件のツイートをCSVでダウンロードしました`);
}

// JSONファイルとしてダウンロード
function downloadTweets() {
  if (tweets.length === 0) {
    console.log("ダウンロードするデータがありません");
    return;
  }

  const dataStr = JSON.stringify(tweets, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `iiGIANT_tweets_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`${tweets.length}件のツイートをJSONでダウンロードしました`);
}

// 使用方法：
// tweets.length - 収集済み件数確認
// downloadTweets() - JSONでダウンロード
// downloadTweetsCSV() - CSVでダウンロード
