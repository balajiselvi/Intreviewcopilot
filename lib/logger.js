const appConfig = require("../config/appConfig");

const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
});

function normalizeError(error) {
  if (!(error instanceof Error)) return error;

  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

function createLogger(context = {}) {
  const configuredLevel = LEVELS[appConfig.logging.level] || LEVELS.info;

  function write(level, event, details = {}) {
    if (LEVELS[level] < configuredLevel) return;

    const record = {
      timestamp: new Date().toISOString(),
      level,
      service: appConfig.logging.service,
      event,
      ...context,
      ...details
    };

    if (record.error) record.error = normalizeError(record.error);

    const message = JSON.stringify(record);
    if (level === "error") console.error(message);
    else if (level === "warn") console.warn(message);
    else console.log(message);
  }

  return Object.freeze({
    debug: (event, details) => write("debug", event, details),
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, details) => write("error", event, details),
    child: (childContext) => createLogger({ ...context, ...childContext })
  });
}

const logger = createLogger();

module.exports = { createLogger, logger };
