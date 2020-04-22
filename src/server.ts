/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import Http = require("http");
import Fs = require("fs");
import { Filepath } from "./bot/botnode";

class K {
    static readonly CSP = "default-src 'self'; style-src 'self' 'unsafe-inline';"
    static readonly PORT = 8080;
    static nocache(res: Http.ServerResponse) {
        res.setHeader("cache-control", "no-cache, no-store, must-revalidate, max-age=0");
        res.setHeader("pragma", "no-cache");
    }
}
export class MinesServer {
    async run() {
        const server = Http.createServer(async (req, res) => {
            if (!req.url) {
                this.notFound(res);
                return;
            }
            let url = req.url.includes("://") ? new URL(req.url) : new URL(`file://${req.url}`);
            let decodedpath = decodeURIComponent(url.pathname);
            res.upgrading = false;
            let content: string | Buffer;
            let filepath = Filepath.pwd().file(decodedpath);
            let ext = filepath.suffix().toLowerCase();
            let mime = this.mime(ext);
            if (mime == null) {
                this.notFound(res);
                return;
            }
            let stat = await filepath.lstat();
            if (stat == null || !stat.isFile()) {
                this.notFound(res);
                return;
            }
            content = Fs.readFileSync(filepath.path());
            res.setHeader('content-security-policy', K.CSP);
            res.setHeader('content-type', mime);
            K.nocache(res);
            res.statusCode = 200;
            res.end(content);
        });
        server.on('error', (err) => console.error(err));
        server.listen(K.PORT);
        console.log(`# Listening on port ${K.PORT} ...`);
    }


    private notFound(stream: Http.ServerResponse) {
        stream.statusCode = 404;
        stream.end();
    }

    private mime(ext: string): string | null {
        switch (ext) {
            case ".jpg": return "image/jpeg";
            case ".png": return "image/png";
            case ".gif": return "image/gif";
            case ".ico": return "image/ico";
            case ".svg": return "image/svg+xml";
            case ".html": return "text/html;charset=utf-8";
            case ".css": return "text/css";
            case ".pdf": return "application/pdf";
            case ".js": return "text/javascript";
            case ".woff2": return "application/font-woff2";
            default: return null;
        }
    }
}

new MinesServer().run();