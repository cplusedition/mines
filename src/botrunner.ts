/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

export interface Task {
    run(): void;
}

export class BotRunner {

    static usage(): void {
        console.log("Usage: ${process.execPath} [-h] <filename> <testname>");
    }

    static run(): number {
        let filename = process.argv[2];
        let testname = process.argv[3];
        if (!filename) {
            BotRunner.usage();
            return 2;
        }
        if (!testname) {
            BotRunner.usage();
            return 3;
        }
        return eval(`const t = require('./${filename}'); t.${testname}();`);
    }
}

BotRunner.run();
