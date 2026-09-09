import { DatabaseSync } from "node:sqlite";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "fde01.db");
const db = new DatabaseSync(DB_PATH);

export default db;
