const fs = require("fs");
const path = require("path");
const webp = require("webp-converter");
const { MongoClient } = require("mongodb");
const { exit } = require("process");

const uri = fs.readFileSync(path.join("db", "uri.txt"));
const dbClient = new MongoClient(uri.toString());
const db = dbClient.db("web");

webp.grant_permission();

db.dropDatabase()

db.collection('recents').insertMany([
  { title: '震惊', body: '一男子在丢失源代码后固执重写', time: new Date('2019-4-3 10:33:26'), cover: 'test' },
  { title: '再次震惊', body: '一男子无缘无故学习数学', time: new Date(), cover: 'test' },
  { title: '第三次震惊', body: '一男子蔑视高考考入清华的学生', time: new Date('1945-2-3 9:4:3'), cover: 'test' }
])

insertImage({ _id: 'test', name: 'Test Image', file: "./db/test/test.jpeg" })
insertImage({ _id: 'avatar', name: 'Avatar', file: "./db/test/avatar.png" })

function getWebpBuf(file) {
  const origin = fs.readFileSync(file);
  return webp.buffer2webpbuffer(origin, path.parse(file).ext.replace(".", ""), "-q 80")
}

function insertImage(option) {
  const tempDir = path.join("node_modules", "webp-converter", "temp");
  if (!fs.existsSync(tempDir))
    fs.mkdirSync(tempDir);

  getWebpBuf(option.file)
    .then((r) => 
      db.collection('images').insertOne({
        _id: option._id,
        name: option.name,
        content: r
      })
    )
}

console.log("Done.")
exit(0)
