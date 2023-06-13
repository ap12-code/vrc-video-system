const express = require("express")()
const ytdl = require("ytdl-core")

express.get("/proxy", (req, res) => {
    let data = req.query.url
    console.log(req.headers["user-agent"])
    if (req.headers["user-agent"].includes("Mozilla")) {
        res.status(302).redirect(data)
    } else {
        try {
            ytdl(data, {filter: (p => p.hasAudio == true && p.hasVideo == true), liveBuffer: 50000}).pipe(res)
        } catch {
            console.error("err")
        }
    }
})
express.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/index.html")
});

express.listen(12321)