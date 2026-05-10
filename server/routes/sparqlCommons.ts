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

function buildSparqlQuery(
  username: string,
  d1?: string,
  d2?: string,
  wikidataId?: string,
  lat?: number,
  lon?: number,
  radi?: number
): string {
  const dateFilters: string[] = [];

  if (d1) {
    dateFilters.push(`FILTER(?date >= "${d1}T00:00:00Z"^^xsd:dateTime)`);
  }
  if (d2) {
    dateFilters.push(`FILTER(?date <= "${d2}T23:59:59Z"^^xsd:dateTime)`);
  }

  const hasWikidata = !!wikidataId;
  const hasCoords = lat !== undefined && lon !== undefined && radi !== undefined;

  let filterBlock = "";
  if (hasWikidata || hasCoords) {
    const conditions: string[] = [];
    if (hasWikidata) {
      conditions.push(`{ ?file wdt:P180 wd:${wikidataId} }`);
    }
    if (hasCoords) {
      conditions.push(`{
    BIND("Point(${lon} ${lat})"^^geo:wktLiteral AS ?center) .
    SERVICE wikibase:around {
      ?file wdt:P1259 ?coords .
      bd:serviceParam wikibase:center ?center ;
                     wikibase:radius "${radi}" .
    }
  }`);
    }

    filterBlock = `FILTER EXISTS {\n  ${conditions.join("\n  UNION\n  ")}\n}`;
  }

  return `
    SELECT ?file ?label ?date ?url ?fullImage WHERE {
      BIND("${username}" AS ?username)
      ?file (p:P170/pq:P4174) ?username;
            wdt:P571 ?date;
            schema:url ?url.
      ${filterBlock}
      OPTIONAL { ?file schema:contentUrl ?fullImage }
      OPTIONAL { ?file schema:caption ?label . FILTER(LANG(?label) = "ca") }
      ${dateFilters.join("\n  ")}
    }
    ORDER BY ?date
    LIMIT 50
  `.trim();
}

router.get("/fotos", async (req, res) => {
  const { d1, d2, wikidata, lat, lon, radi = "0.1" } = req.query;

  if (!process.env.WIKIMEDIA_USER) {
    logger.error("WIKIMEDIA_USER environment variable is not set");
    return res.status(500).json({ error: "Error de configuració." });
  }

  if (!process.env.WCQS_AUTH_TOKEN) {
    logger.error("WCQS_AUTH_TOKEN environment variable is not set");
    return res.status(500).json({ error: "Error de configuració." });
  }

  const isValidWikidataId = (id: string) => /^Q\d+$/.test(id);

  if (wikidata && !isValidWikidataId(wikidata as string)) {
    logger.error(`Invalid Wikidata ID format: ${wikidata}`);
    return res.status(400).json({ error: "Format Wikidata ID invàlid" });
  }

  const latNum = lat ? Math.round(parseFloat(lat as string) * 100000) / 100000 : undefined;
  const lonNum = lon ? Math.round(parseFloat(lon as string) * 100000) / 100000 : undefined;
  const radiNum = parseFloat(radi as string);

  const hasCoords = latNum !== undefined && lonNum !== undefined;

  if (hasCoords) {
    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: "S'han d'especificar lat i lon conjuntament" });
    }
    if (latNum < -90 || latNum > 90) {
      return res.status(400).json({ error: "Latitud ha de ser entre -90 i 90" });
    }
    if (lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: "Longitud ha de ser entre -180 i 180" });
    }
    if (radiNum <= 0) {
      return res.status(400).json({ error: "Radi ha de ser major que 0" });
    }
  }

  const sparqlQuery = buildSparqlQuery(
    process.env.WIKIMEDIA_USER,
    d1 as string | undefined,
    d2 as string | undefined,
    wikidata as string | undefined,
    latNum,
    lonNum,
    radiNum
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
