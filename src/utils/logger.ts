// src/utils/logger.ts

const getTimestamp = (): string => {
  return new Date().toISOString();
};

export const logInfo = (message: string, ...args: unknown[]): void => {
  console.log(`[${getTimestamp()}] [INFO] ${message}`, ...args);
};

export const logError = (message: string, error?: unknown, ...args: unknown[]): void => {
  console.error(`[${getTimestamp()}] [ERROR] ${message}`, ...args);
  if (error) {
    if (error instanceof Error) {
      console.error("Error Details:", error.message);
      if (error.stack) {
        console.error("Stack Trace:", error.stack);
      }
    } else {
      console.error("Error Details (unknown type):", error);
    }
  }
}; 