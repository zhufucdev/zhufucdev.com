Source Code to My Personal Website

# Getting Started

This site is built with Next.js and MUI.

To get started, pull all dependencies:
```bash
$ npm install
```

Specify to your MongoDB server:
```bash
$ echo "mongodb+srv://<user>:<password>@<cluster-url>?retryWrites=true&writeConcern=majority" > ./db/uri.txt
```

To run a local debugging server:
```bash
$ npm run dev
```

To make a production build:
```bash
$ npm run build
```