const express = require("express");
const ytdl = require("ytdl-core");

const app = express();
const port = 12321;

app.get("/proxy", (req, res) => {
    let data = req.query.url;
    console.log(req.headers["user-agent"]);
    if (req.headers["user-agent"].includes("Mozilla")) {
        res.status(302).redirect(data);
    } else {
        try {
            ytdl(data, {
                filter: (p => p.hasAudio == true && p.hasVideo == true),
                liveBuffer: 50000
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
    console.log(`Server running on port ${port}`);
});
