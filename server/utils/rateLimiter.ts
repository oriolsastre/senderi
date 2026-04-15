interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

type RateLimitConfigMap = Record<string, RateLimitConfig>;

const defaultConfig: RateLimitConfigMap = {
  osm: { limit: 60, windowMs: 60000 },
  inaturalist: { limit: 60, windowMs: 60000 }
};

const timestamps: Map<string, number[]> = new Map();

export function setRateLimitConfig(config: Partial<RateLimitConfigMap>): void {
  Object.assign(defaultConfig, config);
}

async function waitForSlot(service: string, windowMs: number): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const times = timestamps.get(service) || [];
      const now = Date.now();
      const recent = times.filter((t) => now - t < windowMs);
      if (recent.length < (defaultConfig[service]?.limit || 60)) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

export async function rateLimit<T>(
  service: string,
  fn: () => Promise<T>,
  config?: RateLimitConfig
): Promise<T> {
  const cfg = config || defaultConfig[service] || { limit: 60, windowMs: 60000 };
  const now = Date.now();

  const times = timestamps.get(service) || [];
  const recent = times.filter((t) => now - t < cfg.windowMs);

  if (recent.length >= cfg.limit) {
    console.log(`Rate limit reached for ${service}, waiting for slot...`);
    await waitForSlot(service, cfg.windowMs);
  }

  const existing = timestamps.get(service) || [];
  timestamps.set(service, [...existing.filter((t) => now - t < cfg.windowMs), now]);

  return fn();
}