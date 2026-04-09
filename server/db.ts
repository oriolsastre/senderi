import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../data/excursions.db");

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS excursions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titol TEXT NOT NULL,
    descripcio TEXT,
    distancia REAL NOT NULL DEFAULT 0,
    desnivell_pos REAL NOT NULL DEFAULT 0,
    desnivell_neg REAL NOT NULL DEFAULT 0,
    osm INTEGER,
    data DATE NOT NULL DEFAULT (date('now')),
    slug TEXT UNIQUE NOT NULL,
    privat INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
