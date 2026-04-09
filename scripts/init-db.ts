import db from "../server/db.js";

console.log("Initializing database...");

const count = db.prepare("SELECT COUNT(*) as count FROM excursions").get() as { count: number };

if (count.count > 0) {
  console.log(`Database already has ${count.count} records. Skipping.`);
} else {
  console.log("Database initialized successfully.");
}
