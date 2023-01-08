> This project is currently under active development

# Getting Started

This site is powered by Next.js and MUI, plus MongoDB as database

## Dependencies

Common practice is to let NPM decide

```bash
$ npm install
```

## Environment Variables

The following are necessary under any circumstances

| name                   | explanation                                                                       |
|:-----------------------|:----------------------------------------------------------------------------------|
| DB_URI                 | To connect with mongodb database, get one from [here](https://cloud.mongodb.com/) |
| SECRET_COOKIE_PASSWORD | Some random 32-word-long string, for iron session encryption                      |
| RECAPTCHA_KEY_BACKEND  | Some reCaptcha key, get one from [here](https://www.google.com/recaptcha)         |
| RECAPTCHA_KEY_FRONTEND | Same as the backend                                                               |

## Start Working

This Next.js project runs in two modes

### Running a Local Debugging Server

Use NPM to run some JavaScript to compile some TypeScript

```bash
$ npm run dev
```

### Making a Production Build

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
    - [x] shelf
    - [ ] third-party raiser
        - [ ] account system
            - [x] registeration
                - [ ] ~~validation via email~~
                - [x] captcha
            - [ ] feedback system
                - [x] reactions
                - [ ] comment section

- [ ] Projects
    - [ ] shelf
        - [ ] ...
        - [ ] statistics
    - [ ] Preview
        - [ ] previewer filter
    - [ ] feedback system

- [ ] About
