/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

/// Core utility classes.

export type Fun00 = () => void;
export type Fun01<R> = () => R;
export type Fun10<T> = (arg1: T) => void;
export type Fun11<T, R> = (arg1: T) => R;
export type Fun20<T1, T2> = (arg1: T1, arg2: T2) => void;
export type Fun21<T1, T2, R> = (arg1: T1, arg2: T2) => R;
export type Fun30<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void;
export type Fun31<T1, T2, T3, R> = (arg1: T1, arg2: T2, arg3: T3) => R;
export type Fun40<T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => void;
export type Fun41<T1, T2, T3, T4, R> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => R;

export interface ILogger {
    d(msg: string): void;
    i(msg: string): void;
    w(msg: string, err?: any): void;
    e(msg: string, err?: any): void;
}

export class Logger implements ILogger {

    protected warns = 0;
    protected errors = 0;

    constructor(protected debugging: boolean) { }

    d(msg: string): void {
        if (this.debugging) console.log(msg);
    }

    i(msg: string): void {
        console.log(msg);
    }

    w(msg: string, err?: any): void {
        ++this.warns;
        console.log(msg);
        if (this.debugging && err) console.log(`${err}`);
    }

    e(msg: string, err?: any): void {
        ++this.errors;
        console.log(msg);
        if (this.debugging && err) console.log(`${err}`);
    }
}

export class Atts {
    [name: string]: string;
}

export class HtmlWriter {
    private _buf = "<!doctype html><html>";
    private _stack: string[] = [];
    private _closed = false;
    constructor() { }
    start_(name: string, attrs?: Atts, empty: boolean = false): this {
        this._buf += `<${name}${this._attrs(attrs)}${empty ? "/>" : ">"}`;
        if (!empty) this._stack.push(name);
        return this;
    }
    end_(count: number = 1): this {
        while (--count >= 0) {
            let name = this._stack.pop();
            this._buf += `</${name}>`;
        }
        return this;
    }
    text_(text: string): this {
        this._buf += HtmlWriter.escText(text);
        return this;
    }
    close_(): this {
        if (!this._closed) {
            this._buf += "</html>";
        }
        return this;
    }
    toString(): string {
        return this._buf;
    }
    private _attrs(attrs?: Atts): string {
        if (!attrs) return "";
        let ret = "";
        for (let key in attrs) {
            let value = attrs[key];
            if (!value) {
                ret += ` ${key}`;
            } else {
                ret += ` ${key}="${HtmlWriter.escAttr(value)}"`;
            }
        }
        return ret;
    }

    static escAttr(value: string): string {
        let ret: string | null = null
        let append = (index: number, c: string) => {
            if (ret == null) ret = value.substring(0, index) + c;
            else ret += c;
        }
        let len = value.length;
        for (let i = 0; i < len; ++i) {
            let c = value.charAt(i);
            switch (c) {
                case '"': append(i, "&quot;"); break;
                case '&': append(i, "&amp;"); break;
                default: if (ret != null) ret = ret + c; break;
            }
        }
        return (ret != null ? ret : value);
    }

    static escText(value: string): string {
        let ret: string | null = null
        let append = (index: number, c: string) => {
            if (ret == null) ret = value.substring(0, index) + c;
            else ret += c;
        }
        let len = value.length;
        for (let i = 0; i < len; ++i) {
            let c = value.charAt(i);
            switch (c) {
                case '\u00a0': append(i, "&nbsp;"); break;
                case '>': append(i, "&gt;"); break;
                case '<': append(i, "&lt;"); break;
                case '&': append(i, "&amp;"); break;
                default: if (ret != null) ret = ret + c; break;
            }
        }
        return (ret != null ? ret : value);
    }
}


export class Ut {

    static stopEvent_(e: Event): void {
        e.stopPropagation();
        e.preventDefault();
    }

    /// @return true If any of the args is NaN.
    static nan_(...args: number[]): boolean {
        return args.some((value) => isNaN(value));
    }

    /// Basically Number.parseInt() but return def instead of NaN.
    static parseInt_(value: string | null | undefined, def: number = NaN, radix?: number): number {
        if (value === null || value === undefined) return def;
        const ret = parseInt(value, radix);
        return isNaN(ret) ? def : ret;
    }

    /// Call callback if result is not NaN.
    static parseInt2_(value: string | null | undefined, callback: Fun10<number>, radix?: number) {
        if (value === null || value === undefined) return;
        const ret = parseInt(value, radix);
        if (!isNaN(ret)) callback(ret);
    }

    static parseDouble_(value: string | null | undefined, def: number = NaN): number {
        if (value === null || value === undefined) return def;
        try {
            return parseFloat(value);
        } catch (e) {
            return def;
        }
    }

    static parseDoublePx_(value: string | null | undefined, def: number = NaN): number {
        if (value == null || value === undefined || value.lastIndexOf("px") != value.length - 2) {
            return def;
        }
        return Ut.parseDouble_(value.substring(0, value.length - 2), def);
    }

    static padStart_(s: string, len: number, padchar = " "): string {
        if (padchar.length == 0) return s;
        while (s.length < len) {
            s = padchar + s;
        }
        return s;
    }

    static timeString_(ms: number, width: number = 6): string {
        if (ms >= 100 * 1000) {
            return Ut.padStart_(`${(ms / 1000).toFixed(0)}s`, width);
        } else if (ms >= 1000) {
            return Ut.padStart_(`${(ms / 1000).toFixed(2)}s`, width);
        }
        return Ut.padStart_(`${ms.toFixed(0)}ms`, width);
    }

    // Polyfill for ES5.
    static spliceString_(s: string, start: number, length: number): string {
        if (length == 0) return s;
        if (start == 0 && length == s.length) return "";
        const prefix = (start == 0 ? "" : s.slice(0, start));
        const suffix = (start + length >= s.length ? "" : s.slice(start + length));
        return prefix.length == 0 ? suffix : suffix.length == 0 ? prefix : prefix + suffix;
    }

    static isEmpty_(s: string | null | undefined): boolean {
        return s === null || s === undefined || s.length == 0;
    }

    static isNotEmpty_(s: string | null | undefined): boolean {
        return !this.isEmpty_(s);
    }

    // Polyfill for ES5.
    static repeatString_(s: string, count: number): string {
        let ret = "";
        while (--count >= 0) ret += s;
        return ret;
    }

    // Polyfill of findIndex() for ES5.
    // @return The index in array that the predicate returns true, otherwise -1.
    static findIndex_<T>(array: T[], predicate: Fun11<T, boolean>): number {
        let index = 0;
        for (const value of array) {
            if (predicate(value)) return index;
            ++index;
        }
        return -1;
    }

    // Polyfill of Array.fill() for ES5.
    // @return The index in array that the predicate returns true, otherwise -1.
    static fill_<T>(array: T[], value: T): T[] {
        for (let index = 0, len = array.length; index < len; ++index) {
            array[index] = value;
        }
        return array;
    }

    static arrayStrictEqual_<T>(arr1: T[], arr2: T[]): boolean {
        const len = arr1.length;
        if (arr2.length !== len) return false;
        return arr1.every((value, index) => {
            return arr2[index] === value;
        });
    }

    static arrayEqual_<T>(arr1: T[], arr2: T[]): boolean {
        const len = arr1.length;
        if (arr2.length !== len) return false;
        return arr1.every((value, index) => {
            return arr2[index] == value;
        });
    }
}

export class RandUt {
    static int1_(max: number) {
        return Math.floor(Math.random() * max);
    }
}

export class Attrs {
    [name: string]: string;
}

export class StringMap<V> {
    [key: string]: V;
}

export class NumberMap<V> {
    [key: number]: V;
}

