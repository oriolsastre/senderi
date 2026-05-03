import { logger } from "./logger.js";

interface ExternalServiceConfig {
  baseUrl: string;
  userAgent: string;
  rateLimit: {
    limit: number;
    windowMs: number;
  };
}

const nodeVersion = process.version;
const inatUser = process.env.INATURALIST_USER;
const contactEmail = process.env.CONTACT_EMAIL || "";

const inatUserAgent = inatUser
  ? `senderi.cat (${contactEmail}; ${inatUser}) Node.js/${nodeVersion}`
  : `senderi.cat (${contactEmail}) Node.js/${nodeVersion}`;

const osmUserAgent = `senderi.cat (${contactEmail}) Node.js/${nodeVersion}`;

const services: Record<string, ExternalServiceConfig> = {
  inaturalist: {
    baseUrl: "https://api.inaturalist.org/v2",
    userAgent: inatUserAgent,
    rateLimit: { limit: 60, windowMs: 60000 }
  },
  osm: {
    baseUrl: "https://www.openstreetmap.org",
    userAgent: osmUserAgent,
    rateLimit: { limit: 60, windowMs: 60000 }
  }
};

export function getServiceConfig(service: string): ExternalServiceConfig | undefined {
  return services[service];
}

export function getServiceBaseUrl(service: string): string {
  const config = services[service];
  if (!config) {
    logger.error(`External service not configured: ${service}`);
    return "";
  }
  return config.baseUrl;
}

export function getServiceHeaders(service: string): Record<string, string> {
  const config = services[service];
  if (!config) {
    return {};
  }
  const headers: Record<string, string> = {
    "User-Agent": config.userAgent
  };

  if (process.env.SITE_URL) {
    headers["Referer"] = process.env.SITE_URL;
  }

  return headers;
}

export function getServiceRateLimit(service: string): { limit: number; windowMs: number } {
  const config = services[service];
  if (!config) {
    return { limit: 60, windowMs: 60000 };
  }
  return config.rateLimit;
}
