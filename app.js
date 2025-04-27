import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    console.log("A socket connected", socket.id);

    socket.on("disconnect", () => {
        console.log("A Socket disconnected", socket.id);
    });
});

server.listen(3000);
