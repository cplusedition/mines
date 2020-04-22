/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

/// Utilities that works with nodejs.

import fs = require("fs");
import Path = require("path");
import { Fun00, Fun10, Fun20 } from "./botcore";

export class Basepath {

    private _basepath: Path.ParsedPath
    private _path: string | null = null;

    constructor(...segments: string[]) {
        this._basepath = Path.parse(segments.join(Path.sep));
    }

    path() {
        if (this._path == null) {
            this._path = Path.join(this._basepath.dir, this._basepath.base);
        }
        return this._path;
    }

    dir() {
        return this._basepath.dir;
    }

    base() {
        return this._basepath.base;
    }

    name() {
        return this._basepath.name;
    }

    suffix() {
        return this._basepath.ext;
    }

    lcSuffix() {
        return this._basepath.ext.toLowerCase();
    }

    parent() {
        return new Basepath(this.dir());
    }

    sibling(base: string): Basepath {
        return new Basepath(this.dir(), base);
    }
}

export type FileWalkerSyncCallback = (filepath: Filepath, rpath: string, stat: fs.Stats) => void;
export type FileWalkerAsyncCallback = (filepath: Filepath, rpath: string, stat: fs.Stats, done: Fun00) => void;

export class Filepath extends Basepath {

    private basedir: string;

    constructor(...segments: string[]) {
        let base = "/";
        let path = Path.normalize(segments.join(Path.sep));
        if (!path.startsWith("/")) {
            base = process.cwd();
            path = Path.normalize(base + Path.sep + path);
        }
        super(path)
        this.basedir = base;
    }

    static resolve(basedir: string, ...segments: string[]): Filepath {
        let path = Path.normalize(segments.join(Path.sep));
        if (!path.startsWith("/")) {
            path = basedir + Path.sep + path;
        }
        return new Filepath(path);
    }

    static pwd(): Filepath {
        return new Filepath(process.cwd());
    }

    rpath(): string {
        return this.path().substring(this.basedir.length);
    }

    file(...segments: string[]): Filepath {
        return new Filepath(this.path(), segments.join(Path.sep));
    }

    existsSync(): boolean {
        try {
            fs.accessSync(this.path(), fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

    existsSyncOrFail(): Filepath | never {
        fs.accessSync(this.path(), fs.constants.F_OK);
        return this;
    }

    lstatSync(): fs.Stats {
        return fs.lstatSync(this.path());
    }

    isFileSync(): boolean {
        return fs.lstatSync(this.path()).isFile();
    }

    isDirectorySync(): boolean {
        return fs.lstatSync(this.path()).isDirectory();
    }

    isEmptyDirSync(): boolean {
        return this.isDirectorySync() && this.listOrEmptySync().length == 0;
    }

    /// Remove this file if this is a file.
    rmSync(): boolean {
        try {
            fs.unlinkSync(this.path());
            return true;
        } catch (e) {
            return false;
        }
    }

    /// Remove this directory if it is an empty directory.
    rmdirSync(): boolean {
        try {
            fs.rmdirSync(this.path());
            return true;
        } catch (e) {
            return false;
        }
    }

    /// Remove everything under this directory.
    rmdirSubtreesSync(): boolean {
        let ret = true;
        for (const name of this.listOrEmptySync()) {
            const file = this.file(name);
            const stat = file.lstatSync();
            if (stat.isFile()) {
                if (!file.rmSync()) ret = false;
            } else if (stat.isDirectory()) {
                if (!file.rmdirSubtreesSync()) ret = false;
                if (!file.rmdirSync()) ret = false;
            }
        }
        return ret;
    }

    /// Remove this directory and everything under this directory.
    rmdirTreeSync(): boolean {
        if (!this.rmdirSubtreesSync()) return false;
        if (!this.rmdirSync()) return false;
        return true;
    }

    copyFileSync(tofile: string, mode?: number) {
        fs.copyFileSync(this.path(), new Filepath(tofile).mkparentSync(mode).path());
    }

    copyFileToDirSync(todir: Filepath, mode?: number) {
        fs.copyFileSync(this.path(), todir.mkdirsSync(mode).file(this.base()).path());
    }

    /// @return Number of files, not including directories, copied.
    copyDirSync(todir: string, mode?: number): number {
        let ret = 0;
        const dstdir = new Filepath(todir);
        this.walkSync((src, rpath, stat) => {
            const dst = dstdir.file(rpath);
            if (stat.isFile()) {
                dst.mkparentSync(mode);
                fs.copyFileSync(src.path(), dst.path());
                ++ret;
            } else if (stat.isDirectory()) {
                dst.mkdirsSync(mode);
            }
        });
        return ret;
    }

    readTextSync(): string {
        return fs.readFileSync(this.path()).toString();
    }

    writeTextSync(data: string, options?: fs.WriteFileOptions) {
        fs.writeFileSync(this.path(), data, options);
    }

    mkdirsSync(mode?: number): this {
        fs.mkdirSync(this.path(), { recursive: true, mode: mode });
        return this;
    }

    mkparentSync(mode?: number): this {
        new Filepath(this.dir()).mkdirsSync(mode);
        return this;
    }

    listOrEmptySync(): string[] {
        try {
            return fs.readdirSync(this.path());
        } catch (e) {
            return [];
        }
    }

    walkSync(callback: FileWalkerSyncCallback) {
        this.walkSync1("", this.lstatSync(), callback);
    }

    scanSync(callback: (filepath: Filepath, rpath: string, stat: fs.Stats) => boolean) {
        this.scanSync1("", this.lstatSync(), callback);
    }

    walkAsync(callback: FileWalkerAsyncCallback, done: Fun00) {
        let stat = this.lstatSync()
        if (!stat.isDirectory()) {
            done();
            return;
        }
        this.walkAsync1(this.listOrEmptySync().sort(), 0, "", callback, done);
    }

    async stat(): Promise<fs.Stats | null> {
        return new Promise((resolve, _reject) => {
            fs.stat(this.path(), (err, stat) => {
                if (err) resolve(null);
                else resolve(stat);
            });
        });
    }

    async lstat(): Promise<fs.Stats | null> {
        return new Promise((resolve, _reject) => {
            fs.lstat(this.path(), (err, stat) => {
                if (err) resolve(null);
                else resolve(stat);
            });
        });
    }

    async isDirectory(): Promise<boolean> {
        return this._lstat((stat) => {
            return stat != null && stat.isDirectory();
        });
    }

    async isFile(): Promise<boolean> {
        return this._lstat((stat) => {
            return stat != null && stat.isFile();
        });
    }

    async isSymbolicLink(): Promise<boolean> {
        return this._lstat((stat) => {
            return stat != null && stat.isSymbolicLink();
        });
    }

    async size(): Promise<number> {
        return this._lstat((stat) => {
            return stat != null ? stat.size : 0;
        });
    }

    async mtime(): Promise<Date> {
        return this._lstat((stat) => {
            return stat != null ? stat.mtime : new Date(0);
        });
    }

    async mtimeMs(): Promise<number> {
        return this._lstat((stat) => {
            return stat != null ? stat.mtimeMs : 0;
        });
    }

    async canRead(): Promise<boolean> {
        return this._access(fs.constants.R_OK);
    }

    async canWrite(): Promise<boolean> {
        return this._access(fs.constants.W_OK);
    }

    async mkdir(options?: number | string | fs.MakeDirectoryOptions | undefined | null): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.isDirectory().then((yes) => {
                if (yes) {
                    resolve(true);
                    return;
                }
                fs.mkdir(this.path(), options, (err) => {
                    resolve(!err);
                });
            });
        });
    }

    async existsOrFail(): Promise<Filepath | never> {
        const self = this;
        return new Promise((resolve, reject) => {
            this._access(fs.constants.F_OK).then((ok) => {
                if (ok) resolve(self)
                else reject();
            });
        });
    }

    private walkSync1(dir: string, stat: fs.Stats, callback: FileWalkerSyncCallback) {
        if (!stat.isDirectory()) return;
        for (const name of this.listOrEmptySync().sort()) {
            const file = new Filepath(this.path(), name);
            const filepath = dir.length == 0 ? name : dir + Path.sep + name;
            const stat = file.lstatSync();
            callback(file, filepath, stat);
            file.walkSync1(filepath, stat, callback);
        }
    }

    private walkAsync1(entries: string[], index: number, dirpath: string, callback: FileWalkerAsyncCallback, done: Fun00) {
        if (index >= entries.length) {
            done();
            return;
        }
        const dir = this;
        const name = entries[index];
        const file = new Filepath(this.path(), name);
        const filepath = dirpath.length == 0 ? name : dirpath + Path.sep + name;
        const filestat = file.lstatSync();
        callback(file, filepath, filestat, () => {
            setTimeout(() => {
                if (filestat.isDirectory()) {
                    file.walkAsync1(file.listOrEmptySync().sort(), 0, filepath, callback, () => {
                        dir.walkAsync1(entries, index + 1, dirpath, callback, done);
                    });
                    return;
                }
                dir.walkAsync1(entries, index + 1, dirpath, callback, done);
            }, 0);
        });
    }

    private scanSync1(dir: string, stat: fs.Stats, callback: (filepath: Filepath, rpath: string, stat: fs.Stats) => boolean) {
        if (!stat.isDirectory()) return;
        for (const name of fs.readdirSync(this.path()).sort()) {
            const file = new Filepath(this.path(), name);
            const filepath = dir.length == 0 ? name : dir + Path.sep + name;
            const stat = file.lstatSync();
            if (callback(file, filepath, stat)) file.scanSync1(filepath, stat, callback);
        }
    }

    private _access(mode: number): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            fs.access(this.path(), mode, (err) => {
                return resolve(err == null);
            });
        });
    }

    private _lstat<T>(callback: (stat: fs.Stats | null) => T): Promise<T> {
        return new Promise((resolve, _reject) => {
            fs.lstat(this.path(), (err, stat) => {
                if (err) resolve(callback(null));
                else resolve(callback(stat));
            });
        });
    }
}


export class Encoding {
    static ascii = "ascii";
    static utf8 = "utf8";
    static utf16le = "utf16le";
    static ucs2 = "ucs2";
    static binary = "binary";
    static latin1 = "latin1";
    static win1252 = "win-1252";
    static iso88591 = "ISO-8859-1";
    static base64 = "base64";
    static hex = "hex";
}

export class With {
    static tmpdir(code: Fun20<Filepath, Fun00>) {
        const dir = new Filepath(fs.mkdtempSync("temp"));
        try {
            code(dir, () => {
                dir.rmdirTreeSync();
            });
        } catch (e) {
            dir.rmdirTreeSync();
            throw e;
        }
    }
    static tmpdirSync(code: Fun10<Filepath>) {
        const dir = new Filepath(fs.mkdtempSync("temp"));
        try {
            code(dir);
        } finally {
            dir.rmdirTreeSync();
        }
    }
}