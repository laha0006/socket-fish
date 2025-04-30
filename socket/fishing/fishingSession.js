export function createFishingSession(socket) {
    return {
        socket,
        isFishing: false,
        isFishOnHook: false,
        fishingTimer: null,
        hookTimeout: null,
    };
}

export function startFishing(session) {
    if (session.isFishing) return;
    session.isFishing = true;
    scheduleNextFish(session);
}

function scheduleNextFish(session) {
    const delay = Math.random() * 5000 + 2000;
    session.fishingTimer = setTimeout(() => {
        fishOnHook(session);
    }, delay);
}

function fishOnHook(session) {
    if (!session.isFishing) return;
    session.isFishOnHook = true;
    session.socket.emit("FishOnHook");

    session.hookTimeout = setTimeout(() => {
        if (session.isFishOnHook) {
            session.isFishOnHook = false;
            session.socket.emit("FishEscaped");
            scheduleNextFish(session);
        }
    }, 5000);
}

export function catchFish(session) {
    if (!session.isFishing || !session.isFishOnHook) return;
    clearTimeout(session.hookTimeout);
    session.isFishOnHook = false;
    session.socket.emit("FishCaught");
    scheduleNextFish(session);
}

export function stopFishing(session) {
    session.isFishing = false;
    clearTimeout(session.fishingTimer);
    clearTimeout(session.hookTimeout);
}
