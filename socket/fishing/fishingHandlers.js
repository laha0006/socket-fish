import {
    createFishingSession,
    startFishing,
    stopFishing,
    catchFish,
    qteComplete,
} from "./fishingSession.js";

export const fishingSessions = new Map();

export function registerFishingHandlers(socket) {
    socket.on("startFishing", () => {
        let session = fishingSessions.get(socket.id);
        if (!session) {
            session = createFishingSession(socket);
            fishingSessions.set(socket.id, session);
        }

        startFishing(session);
    });

    socket.on("catchFish", () => {
        const session = fishingSessions.get(socket.id);

        catchFish(session);
    });

    socket.on("qteComplete", () => {
        const session = fishingSessions.get(socket.id);

        qteComplete(session);
    });

    socket.on("stopFishing", () => {
        const session = fishingSessions.get(socket.id);
        if (!session) return;

        stopFishing(session);
    });
}
