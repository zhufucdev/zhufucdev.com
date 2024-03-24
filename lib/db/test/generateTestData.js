const fs = require("fs");
const path = require("path");
const webp = require("sharp");
const {hash} = require("bcrypt");
const {MongoClient, Binary, GridFSBucket, ObjectId} = require("mongodb");
const sharp = require("sharp");

const uploadTasks = {
    recent: false,
    users: false,
    inspirations: false,
    passwords: false
};

const uri = process.env.DB_URI;
const dbClient = new MongoClient(uri);
const db = dbClient.db("web");

if (process.env.DO_DROP === "false") {
    generateData()
} else {
    db.dropDatabase().then(generateData);
}

async function generateData() {
    const {nanoid} = await import('nanoid');

    db.collection("recents").insertMany([
        {
            _id: nanoid(),
            title: "我上大学了",
            body: "南信大，十二线小学校",
            time: new Date("2022-7-19 16:32:00"),
        },
        {
            _id: nanoid(),
            title: "震惊",
            body: "一男子在丢失源代码后固执重写",
            time: new Date("2022-8-3 10:33:27"),
            cover: "cover",
        },
        {
            _id: nanoid(),
            title: "再次震惊",
            body: "一男子无缘无故学习数学",
            time: new Date(),
            cover: "cover",
        },
        {
            _id: nanoid(),
            title: "第三次震惊",
            body: "一男子蔑视高考考入清华的学生",
            time: new Date("1945-2-3 9:4:3"),
            cover: "cover",
        },
    ]).then(() => uploadTasks.recent = true);

    db.collection("users").insertOne({
        _id: "zhufucdev",
        nick: "zhufucdev",
        permissions: ["*"],
        avatar: "avatar",
        biography: "An individual developer for Java and C#",
        registerTime: new Date("2003-12-4 0:00:00"),
    }).then(() => uploadTasks.users = true);

    db.collection("inspirations").insertMany([
        {
            _id: nanoid(),
            raiser: "zhufucdev",
            body: "做个个人网站",
            implemented: false,
            likes: []
        },
        {
            _id: nanoid(),
            raiser: "zhufucdev",
            body: "学习React",
            implemented: true,
            likes: []
        },
    ]).then(() => uploadTasks.inspirations = true);

    const hashcode = await hash(process.env.ROOT_PWD ?? "ZhuFu132", 10);
    db.collection("passwords").insertOne({
        _id: "zhufucdev",
        password: new Binary(Buffer.from(hashcode))
    }).then(() => uploadTasks.passwords = true);

    const bucket = new GridFSBucket(db, {bucketName: "images"});
    insertImage({_id: "cover", name: "Default cover", file: "./lib/db/test/cover.jpeg"});
    insertImage({_id: "avatar", name: "Avatar", file: "./lib/db/test/avatar.png"});

    function getWebpBuf(file) {
        return sharp(file).webp({quality: 80}).toBuffer()
    }

    function insertImage(option) {
        uploadTasks[option._id] = false;
        getWebpBuf(option.file).then((buf) => {
            const id = new ObjectId();
            const stream = bucket.openUploadStreamWithId(id, option.name);
            stream.end(buf);

            db.collection("images").insertOne({
                _id: option._id,
                name: option.name,
                uploader: "zhufucdev",
                ref: id
            })
            stream.on('close', () => {
                console.log("Uploaded image " + option.file);
                uploadTasks[option._id] = true;
            })
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
