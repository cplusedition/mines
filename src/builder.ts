/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import * as child_process from "child_process";
import * as fs from "fs";
import Path = require("path");
const browserify = require("browserify");
import { Fun00, Logger } from "./bot/botcore";
import { Filepath } from "./bot/botnode";

let log = new Logger(true);

//////////////////////////////////////////////////////////////////////

export function pack() {
    new PackageBuilder().run();
}

export function distSrc() {
    distSrcImpl();
}

export function clean() {
    new Filepath("dist").mkdirsSync().rmdirSubtreesSync();
    new Filepath("mines").mkdirsSync().rmdirSubtreesSync()
    new Filepath("out").mkdirsSync().rmdirSubtreesSync();
    log.d("# Clean done.");
}

//////////////////////////////////////////////////////////////////////

class PackageBuilder {
    run() {
        let minesdir = new Filepath("mines").mkdirsSync();
        minesdir.rmdirSubtreesSync();
        this.browsify(() => {
            new Filepath("html").walkSync((file, rpath, _stat) => {
                let src = file.path();
                let dst = minesdir.file(rpath).path();
                fs.copyFileSync(src, dst);
            });
            log.d("# Done");
        });
    }
    browsify(done: Fun00) {
        let b = browserify();
        b.add("out/bot/botcore.js");
        b.add("out/bot/botui.js");
        b.add("out/mines.js");
        let out = fs.createWriteStream("mines/mines.js");
        b.bundle().pipe(out).on("close", () => {
            log.d("# browserify OK");
            this.uglify(() => {
                new Filepath("mines/mines.js").rmSync();
                done();
            });
            // fs.renameSync("mines/mines.js", "mines/mines-min.js");
            // done();
        });
    }
    uglify(done: Fun00) {
        let uglify = require.resolve('uglify-js/bin/uglifyjs');
        let task = child_process.spawn(uglify, [
            "-m",
            "--mangle-props", "keep_quoted",
            "-o", "mines/mines-min.js",
            "mines/mines.js"
        ])
        task.stdout.pipe(process.stdout);
        task.stderr.pipe(process.stderr);
        task.on("error", (err: Error) => {
            log.e(`ERROR: ${err}`);
        }).on("exit", (code: number, signal: string) => {
            if (code != null && code != 0) {
                log.e(`ERROR: uglify failed: ${signal}`);
            } else {
                log.d("# Uglify OK");
            }
            done();
        });
    }
}

function distSrcImpl() {
    let distdir = new Filepath("dist").mkdirsSync();
    let zipfile = distdir.file("mines-src.zip");
    zipfile.rmSync();
    let args = ["-ry", zipfile.path()];
    for (let name of [".vscode", "html", "screenshots"]) {
        Filepath.pwd().file(name).walkSync((_file, rpath, _stat) => {
            args.push(Path.join(name, rpath));
        });
    }
    args.push("src/bot/botcore.ts", "src/bot/botnode.ts", "src/bot/botbrowser.ts", "src/bot/botrunner.ts", "src/bot/botui.ts");
    args.push("src/mines.ts", "src/server.ts", "src/builder.ts");
    args.push("package.json", "tsconfig.json", "README.md", "COPYRIGHT", "LICENSE", "OFL.txt");
    child_process.execFileSync("zip", args);
    log.d(`# See ${zipfile.path()}`);
}

//////////////////////////////////////////////////////////////////////

