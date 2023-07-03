const express = require("express");
const ytdl = require("ytdl-core");
const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;
const app = express();
const port = 12321;

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
  app.get("/proxy", (req, res) => {
    let data = req.query.url;
    console.log(req.headers["user-agent"]);
    if (req.headers["user-agent"].includes("Mozilla")) {
      res.status(302).redirect(data);
    } else {
      try {
        ytdl(data, {
          filter: (p) => p.hasAudio == true && p.hasVideo == true,
          liveBuffer: 50000,
        }).pipe(res);
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
