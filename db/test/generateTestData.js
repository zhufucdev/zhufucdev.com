const fs = require("fs");
const path = require("path");
const webp = require("webp-converter");
const { MongoClient } = require("mongodb");

const uploadTasks = {};

const uri = fs.readFileSync(path.join("db", "uri.txt"));
const dbClient = new MongoClient(uri.toString());
const db = dbClient.db("web");

webp.grant_permission();

db.dropDatabase().then(generateData);

function generateData() {
  db.collection("recents").insertMany([
    {
      _id: 1,
      title: "我上大学了",
      body: "南信大，十二线小学校",
      time: new Date("2022-7-19 16:32:00"),
    },
    {
      _id: 2,
      title: "震惊",
      body: "一男子在丢失源代码后固执重写",
      time: new Date("2022-8-3 10:33:27"),
      cover: "test",
    },
    {
      _id: 3,
      title: "再次震惊",
      body: "一男子无缘无故学习数学",
      time: new Date(),
      cover: "test",
    },
    {
      _id: 4,
      title: "第三次震惊",
      body: "一男子蔑视高考考入清华的学生",
      time: new Date("1945-2-3 9:4:3"),
      cover: "test",
    },
  ]);

  db.collection("users").insertOne({
    _id: "zhufucdev",
    nick: "zhufucdev",
    permissions: ["*"],
    avatar: "avatar",
    biography: "An individual developer for Java and C#",
    registerTime: new Date("2003-12-4 0:00:00"),
  });

  db.collection("inspirations").insertMany([
    {
      _id: 1,
      raiser: "zhufucdev",
      body: "做个个人网站",
      implemented: false,
    },
    {
      _id: 2,
      raiser: "zhufucdev",
      body: "学习React",
      implemented: true,
    },
  ]);

  insertImage({ _id: "test", name: "Test Image", file: "./db/test/test.jpeg" });
  insertImage({ _id: "avatar", name: "Avatar", file: "./db/test/avatar.png" });

  function getWebpBuf(file) {
    const origin = fs.readFileSync(file);
    return webp.buffer2webpbuffer(
      origin,
      path.parse(file).ext.replace(".", ""),
      "-q 80"
    );
  }

  function insertImage(option) {
    const tempDir = path.join("node_modules", "webp-converter", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    uploadTasks[option._id] = false;
    getWebpBuf(option.file).then((r) => {
      db.collection("images").insertOne({
        _id: option._id,
        name: option.name,
        content: r,
      });
      console.log("Uploaded image " + option.file);
      uploadTasks[option._id] = true;
    });
  }
}

console.log("Submitted");

function isDone() {
  for (let task of Object.getOwnPropertyNames(uploadTasks)) {
    if (!uploadTasks[task]) {
      return false;
    }
  }
  return true;
}

function waitForDeath() {
  if (!isDone()) {
    setTimeout(waitForDeath, 1000);
  } else {
    dbClient.close();
    console.log("Done");
  }
}

waitForDeath();
