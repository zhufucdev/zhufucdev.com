import { Db, MongoClient } from "mongodb";

let closed = false;

const uri = process.env.DB_URI as string;
let dbClient = new MongoClient(uri);
let db = dbClient.db("web");

async function closeDb() {
  if (closed) return;
  await dbClient.close();
}

function requireDatabase(): Db {
  if (!closed) return db;

  dbClient = new MongoClient(uri);
  db = dbClient.db("web");
  closed = false;
  return db;
}

function addCloseHandle() {
  dbClient.on("close", () => (closed = true));
}

export { db, closeDb, requireDatabase };
