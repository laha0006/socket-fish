import { dispatch, FishingEvent } from "./fishingSession.js";

export function registerFishingHandlers(socket) {
    const events = Object.values(FishingEvent);

    events.forEach((event) => {
        socket.on(event, (...args) => {
            dispatch(event, socket, ...args);
        });
    });
}
