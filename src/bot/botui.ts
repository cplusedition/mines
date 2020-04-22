/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { Ut, Fun00, Fun10, StringMap, Fun40 } from "./botcore";
import { DomBuilder } from "./botbrowser";

export class K {
    static readonly xSmokescreen = "x-smokescreen";
    static readonly xSpinner = "x-spinner";
    static readonly xDialog = "x-dialog";
    static readonly xDialogContent = "x-dialog-content";
    static readonly xButton = "x-button";
    static readonly xSymbol = "x-symbol";
    static readonly xVbox = "x-vbox";
    static readonly xHbox = "x-hbox";
    static readonly xContent = "x-content";
    static readonly xToolbar = "x-toolbar";
    static readonly xDisabled = "x-disabled";
    static readonly xSelected = "x-selected";
    static readonly xFlash = "x-flash";
}

class UIKey {
    static readonly _zindexDialog = 4000;
}

export class DomUt {
    static show_(e: HTMLElement, display?: string): HTMLElement {
        if (display) {
            e.style.display = display;
        } else {
            e.style.display = "";
        }
        return e;
    }

    static hide_(e: HTMLElement): HTMLElement {
        e.style.display = "none";
        return e;
    }

    static setVisible_(e: HTMLElement): HTMLElement {
        e.style.visibility = "visible";
        return e;
    }

    static setHidden_(e: HTMLElement): HTMLElement {
        e.style.visibility = "hidden";
        return e;
    }

    static showHidden_(e: HTMLElement, display?: string): HTMLElement {
        e.style.visibility = "hidden";
        DomUt.show_(e, display);
        return e;
    }

    static showVisible_(e: HTMLElement, display?: string): HTMLElement {
        e.style.visibility = "visible";
        DomUt.show_(e, display);
        return e;
    }

    static hideVisible_(e: HTMLElement): HTMLElement {
        return DomUt.setVisible_(DomUt.hide_(e));
    }

    static setVisibleAt_(e: HTMLElement, x: number, y: number) {
        e.style.left = `${x}px`;
        e.style.top = `${y}px`;
        DomUt.setVisible_(e);
        return e;
    }

    static addRemoveClass_(e: Element, add: boolean, c: string) {
        if (add) {
            e.classList.add(c);
        } else {
            e.classList.remove(c);
        }
    }

    static classlistAddRemove_(classlist: DOMTokenList, add: boolean, c: string) {
        if (add) {
            classlist.add(c);
        } else {
            classlist.remove(c);
        }
    }

    static addClickContextmenuListener_(elm: Element, listener: Fun10<Event>) {
        this.addClickListener_(elm, listener);
        elm.addEventListener("contextmenu", listener);
    }

    static addClickListener_(elm: Element, listener: Fun10<Event>) {
        elm.addEventListener("click", listener);
    }

    static removeClickListener_(elm: Element, listener: Fun10<Event>) {
        elm.removeEventListener("click", listener);
    }

    static addTouchstartListener_(elm: Element, listener: Fun10<Event>) {
        elm.addEventListener("mousedown", listener);
    }

    static addTouchendListener_(elm: Element, listener: Fun10<Event>) {
        elm.addEventListener("mouseup", listener);
    }

    static removeTouchstartListener_(elm: Element, listener: Fun10<Event>) {
        elm.removeEventListener("mousedown", listener);
    }

    static removeTouchendListener_(elm: Element, listener: Fun10<Event>) {
        elm.removeEventListener("mouseup", listener);
    }

    /// @return Parent element with all the given classes, otherwise null.
    static getParentWithClasses_(elm: Element, classes: string[]): Element | null {
        const hasclasses = (classlist: DOMTokenList): boolean => {
            return classes.every(c => classlist.contains(c));
        }
        let parent = elm.parentElement;
        while (parent != null) {
            const classlist = parent.classList;
            if (hasclasses(classlist)) return parent;
            if (parent.tagName == "BODY") return null;
            parent = parent.parentElement;
        }
        return null;
    }
}

export type SmokescreenCallback_ = (sm: Smokescreen) => void;

export class Smokescreen {
    private _element: HTMLElement | null = null;
    private _bgColor: string = "#000";
    private _shown = false;

    constructor(
        protected _container: HTMLElement,
        private _zindex: number = UIKey._zindexDialog - 1,
        private _opacity = 0.25,
        private _clickHandler: Fun10<UIEvent>) {
    }

    zindex_(value?: number): number {
        if (value != undefined) {
            this._zindex = value;
        }
        return this._zindex;
    }

    opacity_(value?: number): number {
        if (value != undefined) {
            this._opacity = value;
        }
        return this._opacity;
    }

    bgcolor_(color: string) {
        this._bgColor = color;
    }

    element_(): HTMLElement | null {
        return this._element;
    }

    show_(callback?: SmokescreenCallback_): this {
        this.showitnow_();
        if (callback) callback(this);
        return this;
    }

    hide_(): boolean {
        return this.hide1();
    }

    hide1(): boolean {
        if (!this._shown) {
            return false;
        }
        this._shown = false;
        if (this._element != null) {
            this._element.remove();
            this._element = null;
        }
        return true;
    }

    /** Hide and release all resources. */
    destroy_() {
        this.hide1();
    }

    showitnow_(): boolean {
        if (this._shown || this._container == null) {
            return false;
        }
        this._shown = true;
        this._element = new DomBuilder(this._container).child1_("div", K.xSmokescreen).cursor_() as HTMLElement;
        const style = this._element.style;
        style.zIndex = `${this._zindex}`;
        style.opacity = `${this._opacity}`;
        if (this._bgColor != null) {
            style.backgroundColor = this._bgColor;
        }
        style.display = "block";
        style.pointerEvents = "auto";
        style.touchAction = "none";
        DomUt.addClickContextmenuListener_(this._element, (e: Event) => {
            Ut.stopEvent_(e);
            this._clickHandler(e as UIEvent);
        });
        return true;
    }
}

// //////////////////////////////////////////////////////////////////////

export class Spinner extends Smokescreen {
    private _count = 0;
    private _showTimer: number | null = null;

    constructor(container: HTMLElement) {
        super(container, 9999, 0.25, (_e: UIEvent) => { });
    }

    show_(callback?: SmokescreenCallback_): this {
        return this.show1(0, callback);
    }

    show1(delay: number = 0, callback?: SmokescreenCallback_): this {
        ++this._count;
        if (this._count == 1) {
            if (this._showTimer == null) {
                super.show_((sm) => {
                    const elm = (sm ? sm.element_() : null);
                    if (elm == null) return;
                    elm.style.display = "flex";
                    elm.style.alignItems = "center";
                    elm.style.justifyContent = "center";
                    elm.style.backgroundColor = "#fff";
                    const div = new DomBuilder(elm).child1_("div", K.xSpinner).cursor_() as HTMLElement;
                    div.style.color = "#888";
                    if (callback != null) {
                        window.setTimeout(() => {
                            callback(this);
                        }, delay);
                    }
                });
            }
        }
        return this;
    }

    hide_() {
        --this._count;
        if (this._count == 0) {
            this.destroy_();
            return true;
        }
        return false;
    }

    destroy_() {
        if (this._showTimer != null) {
            window.clearTimeout(this._showTimer);
            this._showTimer = null;
        }
        super.destroy_();
    }
}

export abstract class DialogBase {

    protected _dialog: HTMLElement | null = null;
    protected _smokescreen: Smokescreen | null = null;
    protected _zindex = UIKey._zindexDialog;
    protected _shown = false;

    constructor(protected _container: HTMLElement, protected _buttonSize: number) {
    }

    abstract createContent_(content: HTMLElement): void;
    abstract onSmokescreenClickEvent_(e: UIEvent): void;

    create_(container: HTMLElement): HTMLElement {
        const b = new DomBuilder(container).child_('div', {
            'class': K.xDialog, //
            'style': `display: none; visibility: hidden; z-index: ${this._zindex};`,
        });
        const ret = b.cursor_() as HTMLElement;
        b
            .child1_('table', K.xDialog)
            .push_()
            .child_('tr')
            .child_('td');
        b.child1_('div', K.xDialogContent);
        this.createContent_(b.cursor_() as HTMLElement);
        return ret;
    }

    backgroundColor(color: string) {
        if (this._dialog != null) {
            const table = this._dialog.querySelector("table");
            if (table != null) {
                table.style.backgroundColor = color;
            }
        }
    }

    showDialog_(resizer: Fun00): this {
        if (this._shown || this._dialog == null) return this;
        this._shown = true;
        DomUt.showHidden_(this._dialog, "block");
        if (this._smokescreen == null) {
            this._smokescreen = new Smokescreen(this._container, this._zindex - 1, 0.0, (e: UIEvent) => {
                this.onSmokescreenClickEvent_(e);
            });
            if (resizer != null) {
                resizer();
            }
            this._smokescreen.show_((_sm: Smokescreen) => {
                if (this._dialog != null) DomUt.setVisible_(this._dialog);
            });
        }
        return this;
    }

    hide_() {
        if (!this._shown) return;
        this._shown = false;
        if (this._smokescreen != null) {
            this._smokescreen.destroy_();
            this._smokescreen = null;
        }
        if (this._dialog != null) {
            DomUt.hide_(this._dialog);
        }
    }

    close_() {
        if (!this._shown) return;
        this._shown = false;
        if (this._dialog != null) {
            this._dialog.remove();
            this._dialog = null;
        }
        if (this._smokescreen != null) {
            this._smokescreen.destroy_();
            this._smokescreen = null;
        }
    }
}

export abstract class FixedSizeDialogBase extends DialogBase {

    constructor(container: HTMLElement, buttonsize: number) {
        super(container, buttonsize);
    }

    abstract getContentWidth_(): number;

    buttonSize_(): number {
        return this._buttonSize;
    }

    getDialogChromeWidth_(): number {
        return 20; // padding.
    }

    getDialogWidth_(): number {
        return this.getContentWidth_() + this.getDialogChromeWidth_();
    }

    show_() {
        this.showBesides_(null, null);
    }

    /**
     * @param x, y Window offset, ie. relative to smokescreen.
     */
    showBesides_(x: number | null, y: number | null): this {
        return this.showDialog_(() => {
            if (this._dialog == null) return;
            const winwidth = window.innerWidth;
            const winheight = window.innerHeight;
            const minxmargin = Math.floor(winwidth / 16);
            const width = this.getDialogWidth_();
            let xx;
            let yy;
            if (x == null) {
                const xmargin = (winwidth - width);
                if (xmargin < minxmargin) {
                    xx = minxmargin;
                } else {
                    xx = Math.floor(xmargin / 2);
                }
            } else {
                xx = x - width - minxmargin;
                if (xx < 0) {
                    const xxx = x + minxmargin + width - winwidth;
                    if (xxx <= 0) {
                        xx = x + minxmargin;
                    } else if (xxx < -xx) {
                        xx = winwidth - width;
                    } else {
                        xx = 0;
                    }
                }
            }
            if (y == null) {
                yy = Math.floor(winheight / 16);
            } else {
                const cstyle = window.getComputedStyle(this._dialog);
                const height = Ut.parseDoublePx_(cstyle.height);
                if (isNaN(height)) {
                    yy = Math.floor(winheight / 16);
                } else {
                    const h = Math.ceil(height);
                    yy = y - Math.floor(h / 2);
                    if (yy + h > winheight) {
                        yy = winheight - h;
                    }
                    if (yy < 0) {
                        yy = 0;
                    }
                }
            }
            const style = this._dialog.style;
            style.left = `${xx}px`;
            style.top = `${yy}px`;
        });
    }

    showAboveOrBelow_(elm: Element, preferbelow: boolean = false): this {
        return this.showDialog_(() => {
            if (this._dialog == null) return;
            const margin = 5;
            const winwidth = window.innerWidth;
            const winheight = window.innerHeight;
            const ymargin = Math.floor(winheight / 16);
            const r = elm.getBoundingClientRect();
            const cstyle = window.getComputedStyle(this._dialog);
            const height = Ut.parseDoublePx_(cstyle.height);
            let yy = ymargin;
            if (!isNaN(height)) {
                if (preferbelow) {
                    yy = r.bottom + this.buttonSize_() / 2;
                    if (yy + height + margin > winheight) {
                        yy = r.top - height - this.buttonSize_() / 2;
                        if (yy < margin) {
                            yy = margin;
                        }
                    }
                } else {
                    yy = r.top - height - this.buttonSize_() / 2;
                    if (yy < margin) {
                        yy = r.bottom + this.buttonSize_() / 2;
                        if (yy + height + margin > winheight) {
                            yy = margin;
                        }
                    }
                }
            }
            const width = this.getDialogWidth_();
            let xx = r.left + r.width / 2 - width / 2;
            if (xx + width + margin > winwidth) {
                xx = winwidth - width - margin;
            }
            if (xx < margin) {
                xx = margin;
            }
            const style = this._dialog.style;
            style.left = `${xx}px`;
            style.top = `${yy}px`;
        });
    }
}

export class InfoDialog extends FixedSizeDialogBase {

    readonly _width = 6;

    constructor(container: HTMLElement, buttonsize: number, private _msg: string) {
        super(container, buttonsize)
        this._dialog = this.create_(this._container);
        const table = this._dialog.querySelector("table");
        if (table != null) {
            table.style.width = `${this.getDialogWidth_()}px`;
        }
        DomUt.addClickContextmenuListener_(this._dialog, (e: Event) => {
            Ut.stopEvent_(e);
            this.close_();
        });
    }

    getContentWidth_(): number {
        return this._buttonSize * this._width;
    }

    createContent_(content: HTMLElement): void {
        const b = new DomBuilder(content).child1_("div", K.xVbox).push_();
        b.peek_().child1_("div", K.xContent);
        for (let line of this._msg.split("\n")) {
            b.text_(line);
            b.append1_("br");
        }
    }

    onSmokescreenClickEvent_(e: UIEvent): void {
        Ut.stopEvent_(e);
        this.close_();
    }
}

export class ConfirmationDialog extends FixedSizeDialogBase {

    readonly _width = 6;

    constructor(container: HTMLElement, buttonsize: number, private _msg: string, private _callback: Fun10<boolean>) {
        super(container, buttonsize)
        this._dialog = this.create_(this._container);
        const table = this._dialog.querySelector("table");
        if (table != null) {
            table.style.width = `${this.getDialogWidth_()}px`;
        }
    }

    getContentWidth_(): number {
        return this._buttonSize * this._width;
    }

    createContent_(content: HTMLElement): void {
        const b = new DomBuilder(content).child1_("div", K.xVbox).push_();
        b.peek_().child1_("div", K.xContent);
        for (let line of this._msg.split("\n")) {
            b.text_(line);
            b.append1_("br");
        }
        b.peek_().child_("div", {
            "style": "width: 100%;",
        });
        new Toolbar(b.cursor_(), ["\u{f00c}", "\u{f00d}"], (action: string) => {
            this._callback(action == "\u{f00c}");
            this.close_();
        });
    }

    onSmokescreenClickEvent_(_e: UIEvent): void {
    }
}

export class Toolbar {
    private _element: HTMLElement;
    private _buttons = new StringMap<Element>();
    constructor(container: Element, actions: string[], actionCallback: Fun10<string>) {
        const b = new DomBuilder(container);
        this._element = b.child1_("div", K.xToolbar).push_().cursor_() as HTMLElement;
        for (const action of actions) {
            this._buttons[action] = b.peek_().child1_("div", K.xButton, K.xSymbol).text_(action).cursor_();
        }
        DomUt.addClickListener_(this._element, (e: Event) => {
            Ut.stopEvent_(e);
            const target = e.target;
            if (target == null || !(target instanceof Element)) return;
            if (target.classList.contains(K.xDisabled)) return;
            const text = target.textContent;
            if (text != null) actionCallback(text);
        });
    }
    element_(): HTMLElement {
        return this._element;
    }
    getButton_(action: string): Element {
        return this._buttons[action];
    }
    enableButton_(action: string, enable: boolean): this {
        return this.enableButton1(this.getButton_(action), enable);
    }
    enableButton1(elm: Element, enable: boolean): this {
        if (elm) DomUt.addRemoveClass_(elm, !enable, K.xDisabled);
        return this;
    }
}

export class ClickDetector {
    private _x: number = 0;
    private _y: number = 0;
    private _down: Element | null = null;
    constructor(_element: Element, _callback: Fun40<Element, number, number, number>) {
        const self = this;
        DomUt.addTouchstartListener_(_element, (e: Event) => {
            Ut.stopEvent_(e);
            const target = e.target;
            if (e instanceof MouseEvent && target instanceof Element && e.button == 0) {
                self._x = e.screenX;
                self._y = e.screenY;
                self._down = target;
            }
        });
        DomUt.addTouchendListener_(_element, (e: Event) => {
            Ut.stopEvent_(e);
            const target = e.target;
            if (self._down != null
                && e instanceof MouseEvent
                && target instanceof Element
                && e.button == 0) {
                const x = e.screenX;
                const y = e.screenY;
                const dx = x - self._x;
                const dy = y - self._y;
                const distance = (dx * dx + dy * dy);
                _callback(self._down, self._x, self._y, distance);
            }
            self._down = null;
        });
    }
}

export class Flash {
    static readonly _DEF_DURATION = 150;
    constructor(
        _element: Element,
        _selector: string,
        _flashclass: string = K.xFlash,
        _duration: number = Flash._DEF_DURATION) {
        const listener = (e: Event) => {
            const target = e.target;
            if (target == null || !(target instanceof Element)) return;
            if (!target.matches(_selector)) return;
            const classlist = target.classList;
            if (classlist.contains(K.xDisabled)) return;
            classlist.add(_flashclass);
            window.setTimeout(() => {
                classlist.remove(_flashclass);
            }, _duration);
        };
        DomUt.addTouchstartListener_(_element, listener);
    }
}
