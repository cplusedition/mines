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
import { Fun00, Logger } from "./botcore";
import { Filepath } from "./botnode";

//////////////////////////////////////////////////////////////////////

export function release() {
    new ReleaseBuilder().run();
}

export function dist() {
    distImpl();
}

//////////////////////////////////////////////////////////////////////

class ReleaseBuilder {
    private log = new Logger(true);
    run() {
        let minesdir = new Filepath("mines").mkdirsSync();
        minesdir.rmdirSubtreesSync();
        this.browsify(() => {
            new Filepath("html").walkSync((file, rpath, stat) => {
                let src = file.path();
                let dst = minesdir.file(rpath).path();
                fs.copyFileSync(src, dst);
            });
            this.log.d("# Done");
        });
    }
    browsify(done: Fun00) {
        let b = browserify();
        b.add("out/botcore.js");
        b.add("out/botui.js");
        b.add("out/mines.js");
        b.add("out/app.js");
        let out = fs.createWriteStream("mines/mines.js");
        b.bundle().pipe(out).on("close", () => {
            this.log.d("# browserify OK");
            this.uglify(() => {
                new Filepath("mines/mines.js").rmSync();
                done();
            });
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
            this.log.e(`ERROR: ${err}`);
        }).on("exit", (code: number, signal: string) => {
            if (code != null && code != 0) {
                this.log.e(`ERROR: uglify failed: ${signal}`);
            } else {
                this.log.d("# Uglify OK");
            }
            done();
        });
    }
}

function distImpl() {
    let log = new Logger(true);
    let distdir = new Filepath("dist").mkdirsSync();
    let zipfile = distdir.file("mines.zip");
    zipfile.rmSync();
    let args = ["-ry", zipfile.path()];
    for (let name of [".vscode", "html", "screenshots"]) {
        Filepath.pwd().file(name).walkSync((file, rpath, stat) => {
            args.push(Path.join(name, rpath));
        });
    }
    args.push("src/botcore.ts", "src/botnode.ts", "src/botbrowser.ts", "src/botui.ts", "src/botrunner.ts");
    args.push("src/app.js", "src/mines.ts", "src/server.ts", "src/builder.ts");
    args.push("package.json", "tsconfig.json", "README.md", "COPYRIGHT", "LICENSE", "OFL.txt");
    child_process.execFileSync("zip", args);
    log.d(`# See ${zipfile.path()}`);
}

//////////////////////////////////////////////////////////////////////

