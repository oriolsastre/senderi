import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "database/senderi.db");
const sqlPath = path.resolve(process.cwd(), "database/seed.sql");

console.log("Seeding database...");

const db = new Database(dbPath);
const sql = fs.readFileSync(sqlPath, "utf-8");
db.exec(sql);
console.log("Database seeded successfully.");
