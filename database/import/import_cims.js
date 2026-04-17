import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "database/senderi.db");
const csvDir = path.resolve(process.cwd(), "database/import");
const db = new Database(dbPath);

const csvFile = process.argv[2];
if (!csvFile) {
  console.error("Usage: node import_cims.js <csv_file>");
  process.exit(1);
}

const csvPath = path.resolve(csvDir, csvFile);
if (!fs.existsSync(csvPath)) {
  console.error("File not found: " + csvPath);
  process.exit(1);
}

console.log("Importing from " + csvFile + "...");

const content = fs.readFileSync(csvPath, "utf-8");
const lines = content.split("\n").filter(function (line) { return line.trim(); });
const headers = lines[0].split(",").map(function (h) { return h.trim().replace(/^"|"$/g, ""); });

const stmt = db.prepare(
  "INSERT OR REPLACE INTO waypoints (id, nom, elevacio, lat, lon, tipus, comentari) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

function parseNull(value) {
  if (!value) return null;
  if (value === "NULL") return null;
  value = value.replace(/^"|"$/g, "");
  return value || null;
}

function splitCsv(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

let imported = 0;
for (let i = 1; i < lines.length; i++) {
  const values = splitCsv(lines[i]);
  const row = {};
  headers.forEach(function (header, index) {
    row[header] = values[index] || "";
  });

  const nom = parseNull(row.nom);
  const comentari = parseNull(row.comentari);
  const altitud = row.altitud ? parseInt(row.altitud, 10) : null;

  stmt.run(
    row.cimID ? parseInt(row.cimID, 10) : null,
    nom,
    altitud,
    row.latitud ? parseFloat(row.latitud) : null,
    row.longitud ? parseFloat(row.longitud) : null,
    row.tipus || "Altres",
    comentari
  );
  imported++;
}

console.log("Imported " + imported + " waypoints.");