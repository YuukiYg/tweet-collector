// 設定: 特定のアカウントのみを収集したい場合はここにユーザーIDを設定
// 例: const TARGET_USER_ID = 'YuukiYg'; // 特定のアカウントのみ
// 全てのアカウントを収集する場合は null のまま
const TARGET_USER_ID = 'id';

// 収集済みツイートのIDを追跡
const collectedTweetIds = new Set();
const tweets = [];

function extractTweetData(node) {
  // ツイートIDを取得
  const tweetLink = node.querySelector('a[href*="/status/"]');
  if (!tweetLink) return null;

  const tweetId = tweetLink.href.match(/\/status\/(\d+)/)?.[1];
  if (!tweetId || collectedTweetIds.has(tweetId)) return null;

  // アカウントIDを取得してフィルタリング
  const userLink = node.querySelector('a[href^="/"]:not([href*="/status/"])');
  let userId = "";
  if (userLink) {
    const href = userLink.getAttribute("href");
    userId = href.replace("/", "").split("/")[0];
  }

  // TARGET_USER_IDが指定されている場合はそのアカウントのみ収集
  if (TARGET_USER_ID && userId !== TARGET_USER_ID) {
    return null;
  }

  // 各種データを抽出
  const textElement = node.querySelector('[data-testid="tweetText"]');
  const timeElement = node.querySelector("time");

  // エンゲージメント数値を抽出
  const likeElement = node.querySelector('[data-testid="like"]');
  const retweetElement = node.querySelector('[data-testid="retweet"]');
  const replyElement = node.querySelector('[data-testid="reply"]');

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

  // 日本時間をYYYY-MM-DD HH:mm:ss形式に変換
  let japanTime = "";
  if (timeElement?.getAttribute("datetime")) {
    const date = new Date(timeElement.getAttribute("datetime"));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    japanTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  // 返信先ユーザーを取得
  const replyingTo = node.querySelector('[data-testid="replyingTo"]');
  let replyToWho = "";
  if (replyingTo) {
    const replyText = replyingTo.textContent;
    const match = replyText.match(/@(\w+)/);
    replyToWho = match ? match[1] : "";
  }

  // 返信先ツイートIDを取得（HTMLからは直接取得不可なので空文字）
  const replyToWhichId = "";

  // メディアの有無を判定
  const hasMedia = node.querySelector('[data-testid="tweetPhoto"]') ||
                   node.querySelector('[data-testid="videoPlayer"]') ||
                   node.querySelector('video') ? 1 : 0;

  // 引用ツイートの情報を取得
  let repostToWho = "";
  let repostToWhichId = "";

  // 「引用」というテキストを探す
  const allText = node.innerText || "";
  if (allText.includes("引用")) {
    // 引用ツイート内のリンクを探す
    const links = node.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const href = link.getAttribute("href");
      const match = href.match(/^\/([^/]+)\/status\/(\d+)/);
      // 自分のツイートIDと異なるものを引用先として判定
      if (match && match[2] !== tweetId) {
        repostToWho = match[1];
        repostToWhichId = match[2];
        break;
      }
    }
  }

  return {
    datetime: japanTime,
    userId: userId,
    likes: extractCount(likeElement),
    retweets: extractCount(retweetElement),
    replies: extractCount(replyElement),
    views: extractCount(viewElement) || 0,
    id: tweetId,
    replyToWho: replyToWho,
    replyToWhichId: replyToWhichId,
    hasMedia: hasMedia,
    repostToWho: repostToWho,
    repostToWhichId: repostToWhichId,
    text: textElement?.innerText || "",
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
          console.log(
            `新しい投稿 (${tweets.length}件目) @${tweetData.userId}: ${tweetData.likes}♥ ${tweetData.retweets}🔄 ${tweetData.replies}💬`
          );
        }
      }
    });
  });
});

// 監視開始
observer.observe(document.body, { childList: true, subtree: true });

// CSVファイルとしてダウンロード
function downloadTweetsCSV() {
  if (tweets.length === 0) {
    console.log("ダウンロードするデータがありません");
    return;
  }

  const headers = [
    "投稿日時",
    "ユーザーID",
    "いいね数",
    "リツイート数",
    "リプ数",
    "インプ数",
    "ID",
    "replyToWho",
    "replyToWhichId",
    "hasMedia",
    "repostToWho",
    "repostToWhichId",
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
      t.userId || "",
      t.likes || 0,
      t.retweets || 0,
      t.replies || 0,
      t.views || 0,
      t.id || "",
      t.replyToWho || "",
      t.replyToWhichId || "",
      t.hasMedia || 0,
      t.repostToWho || "",
      t.repostToWhichId || "",
      `"${cleanText}"`,
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const BOM = "\uFEFF";
  const dataBlob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = TARGET_USER_ID
    ? `${TARGET_USER_ID}_tweets_${new Date().toISOString().slice(0, 10)}.csv`
    : `all_tweets_${new Date().toISOString().slice(0, 10)}.csv`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`${tweets.length}件のツイートをCSVでダウンロードしました`);
}

// JSONファイルとしてダウンロード
function downloadTweetsJSON() {
  if (tweets.length === 0) {
    console.log("ダウンロードするデータがありません");
    return;
  }

  const dataStr = JSON.stringify(tweets, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = TARGET_USER_ID
    ? `${TARGET_USER_ID}_tweets_${new Date().toISOString().slice(0, 10)}.json`
    : `all_tweets_${new Date().toISOString().slice(0, 10)}.json`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`${tweets.length}件のツイートをJSONでダウンロードしました`);
}

console.log(
  `収集モード: ${TARGET_USER_ID ? `@${TARGET_USER_ID}のみ` : "全アカウント"}`
);
