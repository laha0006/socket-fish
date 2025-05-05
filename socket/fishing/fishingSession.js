export function createFishingSession(socket) {
    return {
        socket,
        fishingState: FishingState.IDLE,
        isFishing: false,
        isFishOnHook: false,
        isQTE: false,
        qteTimer: null,
        fishingTimer: null,
        hookTimeout: null,
        times: [],
        missCount: 0,
        warnCount: 0,
    };
}

const FishingState = Object.freeze({
    IDLE: "Idle",
    FISHING: "Fishing",
    WAITING_FOR_BITE: "WaitingForBite",
    HOOKED: "Hooked",
    QTE: "Qte",
});

export function startFishing(session) {
    if (session.fishingState != FishingState.IDLE) return;

    session.fishingState = FishingState.FISHING;
    scheduleNextFish(session);
}

function scheduleNextFish(session) {
    if (session.fishingState != FishingState.FISHING) return;

    if (session.missCount >= 3) {
        console.log("missed too much stopped session");
        stopFishing(session);
        return;
    }

    const delay = Math.random() * 2000 + 2000;
    session.fishingTimer = setTimeout(() => {
        session.fishingState = FishingState.WAITING_FOR_BITE;
        fishOnHook(session);
    }, delay);
}

function fishOnHook(session) {
    if (session.fishingState != FishingState.WAITING_FOR_BITE) return;

    session.socket.emit("FishOnHook");
    session.fishingState = FishingState.HOOKED;

    session.hookTimeout = setTimeout(() => {
        if (session.fishingState === FishingState.WAITING_FOR_BITE) {
            session.fishingState = FishingState.FISHING;
            session.socket.emit("FishEscaped");
            session.missCount++;
            scheduleNextFish(session);
        }
    }, 600);
}

function sendQTE(session) {
    if (session.fishingState != FishingState.QTE) return;

    session.startQteTime = Date.now();
    session.socket.emit("QTE");

    session.qteTimer = setTimeout(() => {
        if (session.fishingState === FishingState.QTE) {
            session.socket.emit("FishEscaped");
            session.fishingState = FishingState.FISHING;
            session.missCount++;
            scheduleNextFish(session);
        }
    }, 2500);

    return true;
}

export function qteComplete(session) {
    if (session.fishingState != FishingState.QTE) return;

    session.missCount = 0;
    clearTimeout(session.qteTimer);

    if (isCheating(session)) {
        stopFishing(session);
        return;
    }

    session.fishingState = FishingState.FISHING;
    session.socket.emit("QTESuccess");

    scheduleNextFish(session);
}

export function catchFish(session) {
    if (session.fishingState != FishingState.HOOKED) return;

    clearTimeout(session.hookTimeout);

    session.socket.emit("FishCaught");
    session.fishingState = FishingState.QTE;

    const sent = sendQTE(session);
    if (!sent) {
        session.socket.emit("FishEscaped");
        session.fishingState = FishingState.FISHING;
        session.missCount++;
        scheduleNextFish(session);
    }
}

export function stopFishing(session) {
    session.fishingState = FishingState.IDLE;

    clearTimeout(session.fishingTimer);
    clearTimeout(session.hookTimeout);
    clearTimeout(session.qteTimer);
}

function isStdDevUnderThreshold(times) {
    if (times.length < 10) {
        return false;
    }

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance =
        times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
        times.length;

    const stdDev = Math.sqrt(variance);
    if (stdDev < 20) return true;

    return false;
}

function isCheating(session) {
    const diff = Date.now() - session.startQteTime;
    session.times.push(diff);

    if (diff < 200) {
        session.warnCount++;
    }

    if (session.warnCount > 2) {
        return true;
    }

    if (session.times.length > 10) {
        session.times.shift();
    }

    if (isStdDevUnderThreshold(session.times)) {
        return true;
    }
}
