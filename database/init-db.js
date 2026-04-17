import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "database/senderi.db");
const sqlPath = path.resolve(process.cwd(), "database/database.sql");
const migrationPath = path.resolve(process.cwd(), "database/migration-2025-04-16.sql");

console.log("Initializing database...");

if (!fs.existsSync(dbPath)) {
  const sql = fs.readFileSync(sqlPath, "utf-8");
  const db = new Database(dbPath);
  db.exec(sql);
  console.log("Database created and initialized successfully.");
} else {
  const db = new Database(dbPath);

  const excursionsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='excursions'").get();
  if (!excursionsTable) {
    const sql = fs.readFileSync(sqlPath, "utf-8");
    db.exec(sql);
    console.log("Database initialized with schema.");
  } else {
    const waypointsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='waypoints'").get();
    if (!waypointsTable) {
      const migrationSql = fs.readFileSync(migrationPath, "utf-8");
      db.exec(migrationSql);
      console.log("Migration completed: added waypoints and excursions_waypoints tables.");
    }

    const count = db.prepare("SELECT COUNT(*) as count FROM excursions").get();
    console.log(`Database already exists with ${count.count} records.`);
  }
}
