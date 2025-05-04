export function createFishingSession(socket) {
    return {
        socket,
        isFishing: false,
        isFishOnHook: false,
        isQTE: false,
        qteTimer: null,
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
    const delay = Math.random() * 2000 + 2000;
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
    }, 600);
}

function sendQTE(session) {
    if (!session.isFishing || session.isFishOnHook) return;
    session.isQTE = true;
    session.startQteTime = Date.now();
    session.socket.emit("QTE");
    session.qteTimer = setTimeout(() => {
        if (session.isQTE) {
            session.isQTE = false;
            session.socket.emit("FishEscaped");
            scheduleNextFish(session);
        }
    }, 2500);
}

export function qteComplete(session) {
    if (!session.isFishing || !session.isQTE) return;
    clearTimeout(session.qteTimer);
    const completeTime = Date.now();
    console.log(completeTime - session.startQteTime);
    session.isQTE = false;
    session.socket.emit("QTESuccess");
    scheduleNextFish(session);
}

export function catchFish(session) {
    if (!session.isFishing || !session.isFishOnHook) return;
    clearTimeout(session.hookTimeout);
    session.isFishOnHook = false;
    session.socket.emit("FishCaught");
    sendQTE(session);
    // scheduleNextFish(session);
}

export function stopFishing(session) {
    session.isFishing = false;
    clearTimeout(session.fishingTimer);
    clearTimeout(session.hookTimeout);
}
