const express = require("express");
const ytdl = require("ytdl-core");
const cluster = require("cluster");
const os = require("os");
const url = require("url");

const numCPUs = os.cpus().length;
const app = express();
const port = 12321;

// キャッシュデータを保存するためのオブジェクト
const cache = {};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // ワーカープロセスを生成
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // ワーカープロセスが終了した場合、新しいワーカープロセスを生成
    cluster.fork();
  });
} else {
  // ワーカープロセスの処理
  app.get("/proxy", async (req, res) => {
    let data = req.query.url;
    console.log(req.headers["user-agent"]);

    // URLにhttp://やhttps://がない場合は自動的に追加する
    if (!data.startsWith("http://") && !data.startsWith("https://")) {
      data = `http://${data}`;
    }

    // URLのホスト名がYouTubeのものかどうかチェック
    const hostname = url.parse(data).hostname;
    const isYouTube =
      hostname.includes("youtube.com") || hostname.includes("youtu.be");

    if (!isYouTube) {
      res.status(404).sendFile(__dirname + "/pages/404.html");
      return;
    }

    if (req.headers["user-agent"].includes("Mozilla","Chrome/94","Chrome/90","NSPlayer")) {
      res.status(302).redirect(data);
    } else {
      try {
        // キャッシュにデータが存在するかチェック
        if (cache[data]) {
          console.log("Returning cached data");
          const cachedStream = cache[data];
          cachedStream.pipe(res);
        } else {
          // ytdlの処理を非同期に実行してストリームを取得
          const stream = await getYtdlStream(data);

          // ストリームの終了時にキャッシュからデータを削除
          stream.on("end", () => {
            console.log("Removing cached data");
            delete cache[data];
          });

          // レスポンスにストリームをパイプ
          stream.pipe(res);

          // キャッシュにデータを保存
          console.log("Caching data");
          cache[data] = stream;
        }
      } catch {
        console.error("err");
        res.status(404).sendFile(__dirname + "/pages/404.html");
      }
    }
  });

  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/index.html");
  });

  app.use((req, res) => {
    res.status(404).sendFile(__dirname + "/pages/404.html");
  });

  app.listen(port, () => {
    console.log(`Worker ${process.pid} started and listening on port ${port}`);
  });
}

console.log(`Server running on port ${port}`);

// ytdlのストリームを取得する関数
function getYtdlStream(url) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, {
      filter: (p) => p.hasAudio == true && p.hasVideo == true,
      liveBuffer: 50000,
    });

    stream.on("info", () => {
      resolve(stream);
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}
