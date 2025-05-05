export function createFishingSession(socket) {
    return {
        socket,
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

export function startFishing(session) {
    if (session.isFishing) return;
    session.isFishing = true;
    scheduleNextFish(session);
}

function scheduleNextFish(session) {
    if (session.missCount >= 3) {
        console.log("missed too much stopped session");
        stopFishing(session);
        return;
    }
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
            session.missCount++;
            scheduleNextFish(session);
        }
    }, 600);
}

function sendQTE(session) {
    if (!session.isFishing || session.isQTE) return false;
    session.isQTE = true;
    session.startQteTime = Date.now();
    session.socket.emit("QTE");
    session.qteTimer = setTimeout(() => {
        if (session.isQTE) {
            session.isQTE = false;
            session.socket.emit("FishEscaped");
            session.missCount++;
            scheduleNextFish(session);
        }
    }, 2500);
    return true;
}

export function qteComplete(session) {
    if (!session.isFishing || !session.isQTE) return;
    session.missCount = 0;
    clearTimeout(session.qteTimer);

    if (isCheating(session)) {
        stopFishing(session);
        return;
    }

    session.isQTE = false;
    session.socket.emit("QTESuccess");
    scheduleNextFish(session);
}

export function catchFish(session) {
    if (!session.isFishing || !session.isFishOnHook) return;
    clearTimeout(session.hookTimeout);
    session.isFishOnHook = false;
    session.socket.emit("FishCaught");
    const sent = sendQTE(session);
    if (!sent) {
        session.socket.emit("FishEscaped");
        session.missCount++;
        scheduleNextFish(session);
    }
}

export function stopFishing(session) {
    session.isFishing = false;
    clearTimeout(session.fishingTimer);
    clearTimeout(session.hookTimeout);
    clearTimeout(session.qteTimer);
}

function isStdDevUnderThreshold(times) {
    console.log("standard deviation check");
    console.log(times.length);
    if (times.length < 10) {
        console.log("below 10 times");
        return false;
    }
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    console.log(times);
    const variance =
        times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
        times.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 20) return true;
    return false;
}

function isCheating(session) {
    const diff = Date.now() - session.startQteTime;
    if (diff < 200) {
        session.warnCount++;
    }
    if (session.warnCount > 2) {
        console.log("too fast to be human bro");
        return true;
    }
    session.times.push(diff);
    if (session.times.length > 10) {
        session.times.shift();
    }
    if (isStdDevUnderThreshold(session.times)) {
        console.log("Too consistent for human");
        return true;
    }
}
