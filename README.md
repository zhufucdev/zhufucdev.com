Source Code to My Personal Website

**This project is currently under active development**

# Getting Started

This site is built with Next.js and MUI, plus MongoDB as database.

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

# Roadmap

- [ ] Recents
  - [ ] shelf
    - [x] layout
    - [ ] image viewer
  - [ ] editor

- [ ] Inspirations
  - [ ] shelf
  - [ ] third-party raiser
    - [ ] account system
      - [ ] registeration
        - [ ] validation via email
        - [ ] captcha
      - [ ] feedback system
        - [ ] reactions
        - [ ] comment section

- [ ] Projects
  - [ ] shelf
    - [ ] ...
    - [ ] statistics
  - [ ] Preview
    - [ ] previewer filter
  - [ ] feedback system

- [ ] About
