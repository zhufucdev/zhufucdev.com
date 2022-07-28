import { MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";

const uri = await fs.readFile(path.join("db", "uri.txt"));
const dbClient = new MongoClient(uri.toString());
const db = dbClient.db("web");

export default db;
export { dbClient };
