import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "database/senderi.db");
const sqlPath = path.resolve(process.cwd(), "database/database.sql");

console.log("Initializing database...");

if (fs.existsSync(dbPath)) {
  const count = new Database(dbPath).prepare("SELECT COUNT(*) as count FROM excursions").get();
  console.log(`Database already exists with ${count.count} records.`);
} else {
  const sql = fs.readFileSync(sqlPath, "utf-8");
  const db = new Database(dbPath);
  db.exec(sql);
  console.log("Database created and initialized successfully.");
}
