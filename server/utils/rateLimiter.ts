import { getServiceRateLimit } from "./externalServices.js";
import { logger } from "./logger.js";

const timestamps: Map<string, number[]> = new Map();

async function waitForSlot(service: string, windowMs: number): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const times = timestamps.get(service) || [];
      const now = Date.now();
      const recent = times.filter((t) => now - t < windowMs);
      const cfg = getServiceRateLimit(service);
      if (recent.length < cfg.limit) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

export async function rateLimit<T>(
  service: string,
  fn: () => Promise<T>
): Promise<T> {
  const cfg = getServiceRateLimit(service);
  const now = Date.now();

  const times = timestamps.get(service) || [];
  const recent = times.filter((t) => now - t < cfg.windowMs);

  if (recent.length >= cfg.limit) {
    logger.info(`Rate limit reached for ${service}, waiting for slot...`);
    await waitForSlot(service, cfg.windowMs);
  }

  const existing = timestamps.get(service) || [];
  timestamps.set(service, [...existing.filter((t) => now - t < cfg.windowMs), now]);

  return fn();
}