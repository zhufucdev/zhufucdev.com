import { MongoClient } from "mongodb";

declare global {
  var dbClient: ?MongoClient
}

export {};
