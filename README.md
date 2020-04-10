## Introduction ##
This is a typescript implementation of the mines game, written from scratch. It can be served using the builtin node-js server:
```
    $ node out/server.js &
    # Listening on port 8080 ...
```
Start the game at your browser with `http://localhost:8080/mines/index.html?d=50`. The `d` parameter specify the difficulty in range 0..100, default is 50.

[![Screenshot](screenshots/mines-01-tn.png)](screenshots/mines-01.png) [![Screenshot](screenshots/mines-02-tn.png)](screenshots/mines-02.png)

## Build instruction ##
First of all, pull dependencies with:
```
    npm install --save-dev
```
Open the project in vscode. Make sure the `bot-tsc` task is the default build task and the `bot-runner` task is the default test task. Run the build task to build. To package the JS files, you need `browserify` and `uglify-js`. Select the function name `release` in `builder.ts` and run the `bot-runner` test task to create a ready to run distribution in the `mines/` directory.

## License ##
Released under Apache License 2.0. See [`LICENSE`](LICENSE).

The project use FontAwesome and Ruda-Regular fonts that are distributed under [`http://scripts.sil.org/OFL`](OFL.txt).
