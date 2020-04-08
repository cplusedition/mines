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
import { Ut } from "./botcore";
import { Encoding, Filepath } from "./botnode";

class K {
    static readonly CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
}
export class MinesServer {
    async run() {
        const PORT = 8080;
        const server = Http.createServer(async (req, res) => {
            let url = new URL(`file:///${req.url}`);
            let difficulty = Ut.parseInt_(url.searchParams.get("d"), 50);
            let decodedpath = decodeURIComponent(url.pathname);
            let filepath = Filepath.pwd().file(decodedpath);
            let stat = await filepath.lstat();
            let ext = filepath.suffix().toLowerCase();
            let mime = this.mime(ext);
            res.upgrading = false;
            if (stat == null || !stat.isFile() || mime == null) {
                this.notFound(res);
                return;
            }
            res.setHeader('content-security-policy', K.CSP);
            res.setHeader('content-type', mime);
            res.statusCode = 200;
            if (ext == ".html") {
                let html = Fs.readFileSync(filepath.path()).toString(Encoding.utf8);
                res.end(html.replace("</body>", `<script>startgame(100, ${difficulty});</script></body>`));
            } else {
                res.end(Fs.readFileSync(filepath.path()));
            }
        });
        server.on('error', (err) => console.error(err));
        server.listen(PORT);
        console.log(`# Listening on port ${PORT} ...`);
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