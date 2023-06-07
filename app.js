const express = require("express")()
const ytdl = require("ytdl-core")

express.get("/live", (req, res) => {
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

express.listen(12321)