import Database from "better-sqlite3";
import path from "path";
import { logger } from "./utils/logger.js";

const dbPath = path.resolve(process.cwd(), "database/senderi.db");

logger.info("Connecting to database:", dbPath);

const db = new Database(dbPath);

export default db;
