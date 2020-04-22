/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

/// Utilities that works in browser.

import { Attrs } from "./botcore";

export class DomBuilder {

    private _doc: Document;
    private _stack: Element[] = [];

    constructor(private _cursor: Element) {
        this._doc = _cursor.ownerDocument as Document;
    }

    cursor_(): Element {
        return this._cursor;
    }

    push_(): this {
        this._stack.push(this._cursor);
        return this;
    }

    pop_(): this {
        let e = this._stack.pop();
        if (e) {
            this._cursor = e;
        }
        return this;
    }

    peek_(): this {
        this._cursor = this._stack[this._stack.length - 1];
        return this;
    }

    text_(s: string): this {
        this._cursor.appendChild(this._doc.createTextNode(s));
        return this;
    }

    append_(c: string | Element, attrs?: Attrs): this {
        const e = this.createelm_(c, attrs);
        this._cursor.appendChild(e);
        return this;
    }

    child_(c: string | Element, attrs?: Attrs): this {
        const e = this.createelm_(c, attrs);
        this._cursor.appendChild(e);
        this._cursor = e;
        return this;
    }

    childBefore_(node: Node, c: string | Element, attrs?: Attrs): this {
        const e = this.createelm_(c, attrs);
        this._cursor.insertBefore(e, node);
        this._cursor = e;
        return this;
    }

    empty_(): this {
        for (let c = this._cursor.firstChild; c != null; c = this._cursor.firstChild) {
            this._cursor.removeChild(c);
        }
        return this;
    }

    append1_(c: string | Element, ...classes: string[]): this {
        return this.append_(c, { "class": classes.join(" ") });
    }

    child1_(c: string | Element, ...classes: string[]): this {
        return this.child_(c, { "class": classes.join(" ") });
    }

    childBefore1_(node: Node, c: string | Element, ...classes: string[]): this {
        return this.childBefore_(node, c, { "class": classes.join(" ") });
    }

    private createelm_(c: string | Element, attrs?: Attrs): Element {
        let ret = (typeof c === "string") ? this._doc.createElement(c) : c;
        if (attrs) {
            for (let key in attrs) {
                ret.setAttribute(key, attrs[key]);
            }
        }
        return ret;
    }
}
