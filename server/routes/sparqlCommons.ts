import { Router } from "express";
import got from "got";
import { CookieJar } from "tough-cookie";
import { rateLimit } from "../utils/rateLimiter.js";
import { getServiceBaseUrl, getServiceHeaders } from "../utils/externalServices.js";
import { logger } from "../utils/logger.js";

// Info: https://commons.wikimedia.org/wiki/Commons:SPARQL_query_service

const router = Router();

// Initialize cookie jar and set wcqsOauth cookie
const cookieJar = new CookieJar();
const commonsQueryUrl = getServiceBaseUrl("sparqlCommons");

if (process.env.WCQS_AUTH_TOKEN) {
  cookieJar.setCookieSync(
    `wcqsOauth=${process.env.WCQS_AUTH_TOKEN}`,
    commonsQueryUrl
  );
}

// Initialize got client for WCQS
const wcqsClient = got.extend({
  prefixUrl: commonsQueryUrl,
  cookieJar,
  timeout: { request: 30000 },
  headers: {
    "User-Agent": getServiceHeaders("sparqlCommons")["User-Agent"],
    "Accept": "application/json",
  },
});

function buildSparqlQuery(username: string, d1?: string, d2?: string): string {
  const dateFilters: string[] = [];

  if (d1) {
    dateFilters.push(`FILTER(?date >= "${d1}T00:00:00Z"^^xsd:dateTime)`);
  }
  if (d2) {
    dateFilters.push(`FILTER(?date <= "${d2}T23:59:59Z"^^xsd:dateTime)`);
  }

  return `
    SELECT ?file ?label ?date ?url ?fullImage WHERE {
      BIND("${username}" AS ?username)
      ?file (p:P170/pq:P4174) ?username;
            wdt:P571 ?date;
            schema:url ?url.
      OPTIONAL { ?file schema:contentUrl ?fullImage }
      OPTIONAL { ?file schema:caption ?label . FILTER(LANG(?label) = "ca") }
      ${dateFilters.join("\n  ")}
    }
    ORDER BY ?date
    LIMIT 50
  `.trim();
}

router.get("/fotos", async (req, res) => {
  const { d1, d2 } = req.query;

  if (!process.env.WIKIMEDIA_USER) {
    logger.error("WIKIMEDIA_USER environment variable is not set");
    return res.status(500).json({ error: "Error de configuració." });
  }

  if (!process.env.WCQS_AUTH_TOKEN) {
    logger.error("WCQS_AUTH_TOKEN environment variable is not set");
    return res.status(500).json({ error: "Error de configuració." });
  }

  const sparqlQuery = buildSparqlQuery(
    process.env.WIKIMEDIA_USER,
    d1 as string,
    d2 as string
  );

  try {
    const data = await rateLimit("sparqlCommons", async () => {
      const response = await wcqsClient.post("sparql", {
        body: new URLSearchParams({ query: sparqlQuery }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      return JSON.parse(response.body as string);
    });

    const bindings = data.results?.bindings || [];

    const photos = bindings.map((binding: any) => {
      const commonsUrl = binding.url?.value || null;
      const fullImage = binding.fullImage?.value || null;
      let thumb = null;
      if (commonsUrl) {
        const filename = commonsUrl.split('/').pop();
        if (filename) {
          thumb = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=250`;
        }
      }
      return {
        file: binding.file?.value || null,
        label: binding.label?.value || null,
        date: binding.date?.value || null,
        url: commonsUrl,
        imageUrl: fullImage,
        thumb,
      };
    });

    res.setHeader("Cache-Control", "public, max-age=172800");
    res.json(photos);

  } catch (err: any) {
    logger.error("Failed to fetch from Wikimedia Commons Query Service:", err);

    if (err.response?.statusCode === 302 || err.response?.statusCode === 307) {
      logger.error("Authentication failed. Check WCQS_AUTH_TOKEN cookie value.");
      return res.status(500).json({ error: "Error en obtenir les fotografies." });
    }

    res.status(500).json({ error: "Error en obtenir les fotografies." });
  }
});

export default router;
