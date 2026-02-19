const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// معرف المستخدم الذي طلبته
const USER_ID = "971546905";

let nonce = 0;

// توليد Server Seed قوي
let serverSeed = crypto.randomBytes(32).toString("hex");
let serverHash = crypto.createHash("sha256").update(serverSeed).digest("hex");

// RNG + Provably Fair
function generateCrash(clientSeed) {
    nonce++;

    const message = `${clientSeed}:${nonce}`;

    const hmac = crypto
        .createHmac("sha256", serverSeed)
        .update(message)
        .digest("hex");

    const hInt = parseInt(hmac.substring(0, 13), 16);

    let crashPoint;

    if (hInt % 33 === 0) {
        crashPoint = 1.0;
    } else {
        const r = hInt / Math.pow(2, 52);
        crashPoint = Math.max(1, 1 / (1 - r));
    }

    return {
        crash: crashPoint.toFixed(2),
        hmac,
        nonce
    };
}

// API: هاش السيرفر
app.get("/hash", (req, res) => {
    res.json({
        serverHash
    });
});

// API: بدء جولة
app.get("/play", (req, res) => {
    const clientSeed = USER_ID;

    const result = generateCrash(clientSeed);

    res.json({
        user: USER_ID,
        crash: result.crash,
        nonce: result.nonce,
        serverSeed,
        serverHash,
        proof: result.hmac
    });

    // توليد seed جديد بعد الكشف
    serverSeed = crypto.randomBytes(32).toString("hex");
    serverHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
});

app.listen(PORT, () => {
    console.log("Crash Bot running on port " + PORT);
});
