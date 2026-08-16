/**
 * Anti-Spam Manager for WhatsApp API
 */
const sessionSendHistory = new Map();

/**
 * Validates anti-spam rules before sending a message for a given session.
 * @param {string} sessionId
 */
const validateAntiSpam = async (sessionId) => {
    const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '15', 10);
    const dailyLimit = parseInt(process.env.DAILY_MESSAGE_LIMIT || '500', 10);
    const minDelayMs = parseInt(process.env.MESSAGE_DELAY_MS || '2000', 10);

    const now = Date.now();
    let history = sessionSendHistory.get(sessionId);

    if (!history) {
        history = {
            lastSendTime: 0,
            minuteTimestamps: [],
            dailyCount: 0,
            lastDailyReset: new Date().toDateString()
        };
        sessionSendHistory.set(sessionId, history);
    }

    // Reset daily count if a new day has started
    const today = new Date().toDateString();
    if (history.lastDailyReset !== today) {
        history.dailyCount = 0;
        history.lastDailyReset = today;
    }

    // Check daily limit
    if (dailyLimit > 0 && history.dailyCount >= dailyLimit) {
        throw new Error(`Anti-Spam Restriction: Session "${sessionId}" reached its daily limit of ${dailyLimit} messages.`);
    }

    // Check rate limit per minute
    const oneMinuteAgo = now - 60000;
    history.minuteTimestamps = history.minuteTimestamps.filter(t => t > oneMinuteAgo);

    if (rateLimitPerMinute > 0 && history.minuteTimestamps.length >= rateLimitPerMinute) {
        const oldestInWindow = history.minuteTimestamps[0];
        const waitSeconds = Math.ceil((oldestInWindow + 60000 - now) / 1000);
        throw new Error(`Anti-Spam Restriction: Rate limit exceeded (${rateLimitPerMinute} msgs/min). Please wait ${waitSeconds}s before sending again.`);
    }

    // Apply delay between consecutive messages
    if (minDelayMs > 0 && history.lastSendTime > 0) {
        const elapsed = now - history.lastSendTime;
        if (elapsed < minDelayMs) {
            const waitMs = minDelayMs - elapsed;
            await new Promise(resolve => setTimeout(resolve, waitMs));
        }
    }

    // Record send timestamp
    const sendTime = Date.now();
    history.lastSendTime = sendTime;
    history.minuteTimestamps.push(sendTime);
    history.dailyCount += 1;
};

module.exports = {
    validateAntiSpam
};
