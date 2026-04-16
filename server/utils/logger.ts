function formatDate(): string {
  return new Date().toISOString();
}

export const logger = {
  info: (...args: unknown[]) => console.log(`[${formatDate()}]`, ...args),
  error: (...args: unknown[]) => console.error(`[${formatDate()}]`, ...args),
  warn: (...args: unknown[]) => console.warn(`[${formatDate()}]`, ...args),
};