import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
    registerFishingHandlers,
    fishingSessions,
} from "./socket/fishing/fishingHandlers.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
    },
});
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

io.on("connection", (socket) => {
    console.log("A socket connected", socket.id);

    registerFishingHandlers(socket);

    socket.on("disconnect", () => {
        console.log("A Socket disconnected", socket.id);
        const deleted = fishingSessions.delete(socket.id);
        if (deleted) {
            console.log("deleted fishing session succesfully");
        }
    });
});

server.listen(4000);
