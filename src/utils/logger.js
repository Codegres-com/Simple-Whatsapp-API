const fs = require('fs');
const path = require('path');

const LOGS_DIR = './logs';

if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Helper to get date/time parts in specified timezone (default America/Guatemala).
 */
const getTimezoneParts = (date = new Date()) => {
    const tz = process.env.TIMEZONE || 'America/Guatemala';
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false
    });
    const parts = {};
    for (const p of formatter.formatToParts(date)) {
        parts[p.type] = p.value;
    }
    return parts;
};

/**
 * Gets formatted date string YYYY-MM-DD in Guatemala timezone for daily log file naming.
 */
const getDailyLogFileName = () => {
    const p = getTimezoneParts(new Date());
    return path.join(LOGS_DIR, `access-${p.year}-${p.month}-${p.day}.log`);
};

/**
 * Appends an entry to the daily access log in Guatemala timezone.
 */
const logAccess = ({ appName, keyMasked, endpoint, method, ip, status, details }) => {
    // Check if logging is enabled (1 = enabled, 0 = disabled)
    const enabled = process.env.ENABLE_LOGS ?? process.env.GENERATE_LOGS ?? '1';
    if (enabled !== '1' && enabled !== 'true') {
        return;
    }

    const p = getTimezoneParts(new Date());
    const ms = p.fractionalSecond ? `.${p.fractionalSecond}` : '';
    const timestamp = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${ms}-06:00`;

    const logLine = `[${timestamp}] App: "${appName}" | Key: "${keyMasked}" | Method: ${method} | Endpoint: ${endpoint} | Status: ${status} | IP: ${ip}${details ? ' | ' + details : ''}\n`;
    try {
        const logFile = getDailyLogFileName();
        fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (err) {
        console.error('Failed to write to access log:', err);
    }
};

module.exports = {
    logAccess
};
