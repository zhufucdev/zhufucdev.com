import { Db, MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";

let db: Db;

if (!global.dbClient) {
  const uri = await fs.readFile(path.join("db", "uri.txt"));
  global.dbClient = new MongoClient(uri.toString());

  global.dbClient.on("close", () => {
    console.warn("Database client closed unexpectedly. Reconnecting...");
    global.dbClient = new MongoClient(uri.toString());
    db = global.dbClient.db("web");
  });
}

db = global.dbClient.db("web");

export default db;
