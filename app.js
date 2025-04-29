import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let playerStartFishing;
app.get("/start", (req, res) => {
    const now = Date.now();
    playerStartFishing = now;
    res.send({ time: now });
});

app.get("/stop", (req, res) => {
    const now = Date.now();
    const diff = now - playerStartFishing;
    const seconds = diff / 1000;
    res.send({ diff: diff, seconds: seconds });
});

function startFish(socket) {
    socket.emit("FishingStarted");
    socket.on("catch", (data) => {
        console.log("Fish?");
    });
}

const sessions = new Set();

io.on("connection", (socket) => {
    console.log("A socket connected", socket.id);

    socket.on("custom", (data) => {
        console.log("custom!!");
        if (sessions.has(socket.id)) {
            console.log("return");
            return;
        }
        sessions.add(socket.id);
        startFish(socket);
    });

    socket.on("disconnect", () => {
        console.log("A Socket disconnected", socket.id);
    });
});

server.listen(3000);
