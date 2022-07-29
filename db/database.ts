import { Db, MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";

let closed = false;

const uri = (await fs.readFile(path.join("db", "uri.txt"))).toString();
let dbClient = new MongoClient(uri);
let db = dbClient.db("web");

function closeDb() {
  if (closed) return;
  dbClient.close();
}

function renewDb(): Db {
  if (!closed) return db;

  dbClient = new MongoClient(uri);
  db = dbClient.db("web");
  closed = false;
  return db;
}

function addCloseHandle() {
  dbClient.on('close', () => closed = true);
}

export { db, closeDb, renewDb };
