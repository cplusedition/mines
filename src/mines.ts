/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { Attrs, RandUt, StringMap, Ut } from "./bot/botcore";
import { DomBuilder } from "./bot/botbrowser";
import { K, ConfirmationDialog, DomUt, ClickDetector, InfoDialog } from "./bot/botui";

class MK {
    static readonly _DEF_CELLSIZE = 28;
    static readonly _DEF_MAPSIZE = 100;
    static readonly _DEF_DIFFICULTY = 50;
    static readonly _MIN_BOMBS = 0.15;
    static readonly _MAX_BOMBS = 0.25;
    static readonly _MIN_CHEATS = 3;
    static readonly _MAX_CHEATS = 7;
    static readonly _CHEAT = "\u{f21b}"
    //
    static readonly _mapsize = "m";
    static readonly _difficulty = "d";
    static readonly _rows = "r";
    static readonly _cols = "c";
    static readonly _mines = "n";
    static readonly _bombs = "b";
    static readonly _map = "M";
    static readonly _flags = "f";
    static readonly _opens = "o";
    static readonly _cheats = "C";
    //
    static readonly _xxOpen = 0x01;
    static readonly _xxFlag = 0x02;
    static readonly _xxBomb = 0x04;
    //
    static readonly _row = "XtJ";
    static readonly _col = "XzL";
    static readonly _newGame = "X6E";
    //
    static readonly _minRows = 8;
    static readonly _minCols = 8;
    //
    static readonly xxRoot = "xx-root";
    static readonly xxTop = "xx-top";
    static readonly xxMap = "xx-map";
    static readonly xxLabel = "xx-label";
    static readonly xxMessage = "xx-message";
    static readonly xxRow = "xx-row";
    static readonly xxCell = "xx-cell";
    static readonly xxOpen = "xx-open";
    static readonly xxEmpty = "xx-empty";
    static readonly xxHint = "xx-hint";
    static readonly xxFlag = "xx-flag";
    static readonly xxBomb = "xx-bomb";
    static readonly xxWrong = "xx-wrong";
    static readonly xxCheatsUsed = "xx-cheats-used";
    static readonly xxCheatsAvail = "xx-cheats-avail";
    static readonly xxGameover = "xx-gameover";
    //
    static readonly classes_ = (() => {
        const ret = new Array<string>(8);
        for (let index = 0; index < 8; ++index) {
            let value = MK.xxCell;
            if ((index & MK._xxOpen) != 0) value += " " + MK.xxOpen;
            if ((index & MK._xxFlag) != 0) value += " " + MK.xxFlag;
            if ((index & MK._xxBomb) != 0) value += " " + MK.xxBomb;
            ret[index] = value;
        }
        return ret;
    })();
}

export class RS {
    static readonly YouWin = "You win !!!";
    // Mines
    static readonly GameOver = "Game over";
    static readonly GameMinesNewGame = "New game";
    static readonly GameMinesInstruction = "Left-click to open. Right-click or swipe to flag. Left-click on flag to cheat.";
    // Sudoku
    static readonly hints = "hints";
    static readonly GameHistoryIsFull = "History is full";
    static readonly GameHistoryIsEmpty = "History is empty";
    static readonly GameStateSaved = "Game state saved";
    static readonly GameStateRestored = "Game state restored";
    static readonly AreYouSureYouWantToCheat = "Are you sure you want to cheat ?";
    static readonly GameRestoreSnapshot = "Restore snapshot";
    static readonly NoMoreCheats = "No more cheats !";
    static readonly VERY_HARD = "Very hard";
    static readonly HARD = "Hard";
    static readonly MODERATE = "Moderate";
    static readonly EASY = "Eary";
    static readonly VERY_EASY = "Very easy";
}

export class MSG {
    static string_(msgid: string): string {
        return msgid;
    }
}

class MinesSiblings {
    constructor(public row: number, public col: number, public cell: Element) { }
}

class MinesState {
    _mapSize: number;
    _difficulty: number;
    _rows: number = 0;
    _cols: number = 0;
    _mines: number = 0;
    _bombs: boolean[][] = [];
    _total: number = 0;
    _flags = 0;
    _opens = 0;
    _cheats = 0;
    _gameover = false;
    _victory = false;
    _down: Element | null = null;
    _x = 0;
    _y = 0;

    constructor(mapsize: number = MK._DEF_MAPSIZE, difficulty: number = MK._DEF_DIFFICULTY) {
        this._mapSize = (mapsize > 100 ? 100 : mapsize < 0 ? 0 : mapsize);
        this._difficulty = (difficulty > 100 ? 100 : difficulty < 0 ? 0 : difficulty);
    }

    toJSON_(map: number[][]): string | null {
        if (this._gameover) return null;
        const ret = new StringMap<any>();
        ret[MK._mapsize] = this._mapSize;
        ret[MK._difficulty] = this._difficulty;
        ret[MK._rows] = this._rows;
        ret[MK._cols] = this._cols;
        ret[MK._mines] = this._mines;
        ret[MK._bombs] = this._bombs;
        ret[MK._flags] = this._flags;
        ret[MK._opens] = this._opens;
        ret[MK._cheats] = this._cheats;
        ret[MK._map] = map;
        return JSON.stringify(ret);
    }

    fromJSON_(state: StringMap<any>): number[][] | null {
        try {
            this._rows = state[MK._rows];
            this._cols = state[MK._cols];
            this._total = this._rows * this._cols;
            this._mines = state[MK._mines];
            this._bombs = state[MK._bombs];
            this._flags = state[MK._flags];
            this._opens = state[MK._opens];
            this._cheats = state[MK._cheats];
            return state[MK._map];
        } catch (e) {
            return null;
        }
    }
}

export class MinesGame {
    private _top: HTMLElement;
    private _map: Element;
    private _label: Element;
    private _confirmation: ConfirmationDialog | null = null;
    //
    private _cellSize: number;
    private _state = new MinesState();

    /// @param cellsize
    /// @param mapSize In range 0..100.
    /// @param diffculty In range 0..100.
    constructor(cellsize: number = MK._DEF_CELLSIZE) {
        this._cellSize = cellsize;
        let b = new DomBuilder(document.body).empty_().child1_("div", MK.xxRoot);
        this._top = b.child1_("div", MK.xxTop).push_().cursor_() as HTMLElement;
        this._map = b.child1_("div", MK.xxMap).cursor_();
        // Use minimal text to determine height.
        this._label = b.peek_().child1_("div", MK.xxLabel).text_("0").cursor_();
        this._map.addEventListener("contextmenu", (e: Event) => {
            Ut.stopEvent_(e);
            if (self._state._gameover) {
                setTimeout(() => {
                    self.newGame(self._state._mapSize, self._state._difficulty);
                }, 0)
                return;
            };
            let target = e.target;
            if (target instanceof Element && target.classList.contains(MK.xxCell)) {
                this.flagCallback_(target);
            }
        });
        const self = this;
        new ClickDetector(this._map, (target, _x, _y, distance) => {
            if (self._state._gameover) {
                setTimeout(() => {
                    self.newGame(self._state._mapSize, self._state._difficulty);
                }, 0)
                return;
            };
            if (!target.classList.contains(MK.xxCell)) return;
            if (distance > self._cellSize * self._cellSize / 4) {
                self.flagCallback_(target);
            } else {
                self.cellCallback_(target);
            }
        });
    }

    static startGame() {
        let url = new URL(window.location.href);
        let cellsize = Ut.parseInt_(url.searchParams.get("c"), MK._DEF_CELLSIZE);
        let difficulty = Ut.parseInt_(url.searchParams.get("d"), MK._DEF_DIFFICULTY);
        let root = document.querySelector(":root")
        if (root != null && root instanceof HTMLElement) {
            root.style.setProperty("--xx-cell-size", `${cellsize}px`);
        }
        new MinesGame(cellsize).newGame(MK._DEF_MAPSIZE, difficulty);
    }

    newGame(mapsize: number = MK._DEF_MAPSIZE, difficulty: number = MK._DEF_DIFFICULTY, saved: string | null = null) {
        if (this._confirmation != null) {
            this._confirmation.close_();
            this._confirmation = null;
        }
        DomUt.showHidden_(this._top);
        if (!this.restoreGame_(mapsize, difficulty, saved)) {
            this._state = new MinesState(mapsize, difficulty);
            let labelrect = this._label.getBoundingClientRect();
            let trim = labelrect.height;
            let winw = window.innerWidth;
            let winh = window.innerHeight;
            //#IF DEBUG
            console.log(`# window: ${winw}x${winh}`);
            //#ENDIF DEBUG
            let h = (winh - trim - this._cellSize - 2 - 2);
            let w = (winw - this._cellSize /* top padding */ - 2 /* map border */ - 2 /* safety */);
            let rows = Math.floor(h / this._cellSize);
            let cols = Math.floor(w / this._cellSize);
            this._state._rows = (rows <= MK._minRows ? rows : MK._minRows + Math.floor((rows - MK._minRows) * this._state._mapSize / 100));
            this._state._cols = (cols <= MK._minCols ? cols : MK._minCols + Math.floor((cols - MK._minCols) * this._state._mapSize / 100));
            this._state._total = this._state._rows * this._state._cols;
            let min = this._state._total * MK._MIN_BOMBS;
            let delta = this._state._total * (MK._MAX_BOMBS - MK._MIN_BOMBS);
            this._state._mines = Math.floor(min + delta * this._state._difficulty / 100);
            //#IF DEBUG
            console.log(`# rows=${this._state._rows}, cols=${this._state._cols}, mines=${this._state._mines}, trim=${trim}`);
            //#ENDIF DEBUG
            const [startrow, startcol, startcell] = MinesGame.createmap_(this._map, this._state._rows, this._state._cols);
            this._state._bombs = this.generateMines_(this._state._rows, this._state._cols, this._state._mines, startrow, startcol);
            if (startcell != null) {
                // Should alway be the case.
                this.open1(startrow, startcol, startcell, startcell.classList);
            }
        }
        this.updateStatus_();
        DomUt.setVisible_(this._top);
        new InfoDialog(document.body,
            Math.ceil(this._cellSize * 4 / 3),
            MSG.string_(RS.GameMinesInstruction))
            .show_();
    }

    saveGame(): string | null {
        return this._state.toJSON_(this.readmap_());
    }

    private static createmap_(elm: Element, rows: number, cols: number): [number, number, Element | null] {
        const startrow = 1 + RandUt.int1_(rows - 2);
        const startcol = 1 + RandUt.int1_(cols - 2);
        let startcell: Element | null = null;
        const b = new DomBuilder(elm).empty_().push_();
        for (let r = 0; r < rows; ++r) {
            b.peek_().child1_("div", MK.xxRow);
            for (let c = 0; c < cols; ++c) {
                let a = new Attrs();
                a[MK._row] = r.toFixed(0);
                a[MK._col] = c.toFixed(0);
                a["class"] = MK.xxCell;
                if (r == startrow && c == startcol) {
                    startcell = b.push_().child_("div", a).cursor_();
                    b.pop_();
                } else {
                    b.append_("div", a);
                }
            }
        }
        return [startrow, startcol, startcell];
    }

    private static recreatemap_(elm: Element, rows: number, cols: number, bombs: boolean[][], map: number[][]) {
        const b = new DomBuilder(elm).empty_().push_();
        const cells: Element[][] = [];
        for (let r = 0; r < rows; ++r) {
            b.peek_().child1_("div", MK.xxRow).push_();
            let row = new Array<Element>();
            cells.push(row);
            for (let c = 0; c < cols; ++c) {
                let a = new Attrs();
                a[MK._row] = r.toFixed(0);
                a[MK._col] = c.toFixed(0);
                const m = map[r][c] || 0;
                a["class"] = MK.classes_[m] || MK.xxCell;
                row.push(b.peek_().child_("div", a).cursor_());
            }
            b.pop_();
        }
        for (let r = 0; r < rows; ++r) {
            for (let c = 0; c < cols; ++c) {
                const m = map[r][c] || 0;
                if ((m & MK._xxOpen) != 0) {
                    const cell = cells[r][c];
                    if (!cell) continue;
                    const hint = MinesGame.gethint_(bombs, r, c, cell);
                    if (hint == 0) {
                        cell.classList.add(MK.xxEmpty);
                    } else {
                        cell.classList.add(MK.xxHint);
                        cell.textContent = hint.toFixed(0);
                    }
                }
            }
        }
    }

    private readmap_(): number[][] {
        const ret: number[][] = [];
        for (let i = 0; i < this._state._rows; ++i) {
            ret.push(Ut.fill_(new Array<number>(this._state._cols), 0));
        }
        this._map.querySelectorAll(`.${MK.xxCell}`).forEach((cell) => {
            const row = Ut.parseInt_(cell.getAttribute(MK._row));
            const col = Ut.parseInt_(cell.getAttribute(MK._col));
            if (isNaN(row) || isNaN(col)) return;
            const classlist = cell.classList;
            let value = 0;
            if (classlist.contains(MK.xxOpen)) value |= MK._xxOpen;
            if (classlist.contains(MK.xxFlag)) value |= MK._xxFlag;
            if (classlist.contains(MK.xxBomb)) value |= MK._xxBomb;
            ret[row][col] = value;
        });
        return ret;
    }

    private restoreGame_(mapsize: number, difficulty: number, saved: string | null): boolean {
        if (saved == null) return false;
        try {
            const json = JSON.parse(saved);
            const state = new MinesState(mapsize, difficulty);
            const map = state.fromJSON_(json);
            if (map == null) return false;
            MinesGame.recreatemap_(this._map, state._rows, state._cols, state._bombs, map);
            this._state = state;
            return true;
        } catch (e) {
            return false;
        }
    }

    private generateMines_(rows: number, cols: number, mines: number, startrow: number, startcol: number): boolean[][] {
        let ret: boolean[][] = [];
        for (let r = 0; r < rows; ++r) {
            let row: boolean[] = [];
            ret.push(row);
            for (let c = 0; c < cols; ++c) {
                row.push(false);
            }
        }
        while (--mines >= 0) {
            while (true) {
                let r = RandUt.int1_(rows);
                let c = RandUt.int1_(cols);
                let dr = r - startrow;
                let cr = c - startcol;
                // Make sure start cell is empty.
                if (dr >= -1 && dr <= 1 && cr >= -1 && cr <= 1) continue;
                // this.log.d(`# ${r}, ${c}`);
                if (ret[r][c]) continue;
                ret[r][c] = true;
                break;
            }
        }
        return ret;
    }

    private static neighbours_(row: number, col: number, cell: Element): MinesSiblings[] {
        let ret: MinesSiblings[] = [];
        let add = (row: number, col: number, cell: Element | null) => {
            if (cell == null) return;
            ret.push(new MinesSiblings(row, col, cell));
        }
        let addrow = (row: number, col: number, parent: Element | null) => {
            if (parent == null) return;
            let cell = parent.children[col];
            if (cell) {
                add(row, col - 1, cell.previousElementSibling);
                add(row, col, cell);
                add(row, col + 1, cell.nextElementSibling);
            }
        }
        add(row, col - 1, cell.previousElementSibling);
        add(row, col + 1, cell.nextElementSibling);
        let parent = cell.parentElement;
        if (parent) {
            addrow(row - 1, col, parent.previousElementSibling);
            addrow(row + 1, col, parent.nextElementSibling);
        }
        return ret;
    }

    private static gethint_(bombs: boolean[][], row: number, col: number, cell: Element): number {
        let count = 0;
        for (let c of MinesGame.neighbours_(row, col, cell)) {
            if (bombs[c.row][c.col]) {
                count += 1;
            }
        }
        return count;
    }

    private clearFlag_(classlist: DOMTokenList): boolean {
        if (classlist.contains(MK.xxFlag)) {
            classlist.remove(MK.xxFlag);
            return true;
        }
        return false;
    }

    private open1(row: number, col: number, cell: Element, classlist: DOMTokenList): void {
        this._state._opens += 1;
        let hint = MinesGame.gethint_(this._state._bombs, row, col, cell);
        if (hint > 0) {
            classlist.add(MK.xxOpen);
            classlist.add(MK.xxHint);
            cell.textContent = `${hint}`;
            if (this.clearFlag_(classlist)) this._state._flags -= 1;
            this.updateStatus_();
            return;
        }
        classlist.add(MK.xxOpen);
        classlist.add(MK.xxEmpty);
        if (this.clearFlag_(classlist)) this._state._flags -= 1;
        this.updateStatus_();
        if (this._state._gameover) return;
        for (let c of MinesGame.neighbours_(row, col, cell)) {
            let classlist = c.cell.classList;
            if (classlist.contains(MK.xxOpen)) continue;
            if (this._state._bombs[c.row][c.col]) continue;
            this.open1(c.row, c.col, c.cell, classlist);
            if (this._state._gameover) return;
        }
    }

    private updateStatus_(): void {
        if (this._state._opens + this._state._mines == this._state._total) {
            this._state._gameover = true;
            this._state._victory = true;
            this.toast_(RS.YouWin);
            this.gameover1();
            return;
        }
        let b = new DomBuilder(this._label).empty_().push_()
            .child_("span").text_(`${this._state._flags}\u{00a0}/\u{00a0}${this._state._mines}\u00a0/\u00a0`)
        // + `\u{00a0}/\u{00a0}${this._cols}x${this._rows}`;
        if (this._state._cheats > 0) {
            let cheats = Ut.repeatString_(MK._CHEAT, this._state._cheats);
            b.peek_().child_("span", {
                "class": `${K.xSymbol} ${MK.xxCheatsUsed}`,
            }).text_(cheats)
        }
        let max = this.maxCheats_();
        if (this._state._cheats < max) {
            let left = Ut.repeatString_(MK._CHEAT, max - this._state._cheats);
            b.peek_().child_("span", {
                "class": `${K.xSymbol} ${MK.xxCheatsAvail}`,
            }).text_(left)
        }
    }

    private flagCallback_(cell: Element): void {
        let classlist = cell.classList;
        if (classlist.contains(MK.xxOpen) || classlist.contains(MK.xxBomb)) {
            return;
        }
        classlist.toggle(MK.xxFlag);
        this._state._flags += classlist.contains(MK.xxFlag) ? 1 : -1;
        this.updateStatus_();
    }

    private maxCheats_() {
        return MK._MIN_CHEATS + Math.round(this._state._difficulty * (MK._MAX_CHEATS - MK._MIN_CHEATS) / 100);
    }

    private cellCallback_(cell: Element): void {
        let classlist = cell.classList;
        if (classlist.contains(MK.xxOpen) || classlist.contains(MK.xxBomb)) return;
        if (classlist.contains(MK.xxFlag)) {
            if (this._state._cheats >= this.maxCheats_()) {
                this.toast_(RS.NoMoreCheats);
                return;
            }
            classlist.add(K.xSelected);
            this._confirmation = new ConfirmationDialog(
                document.body,
                Math.ceil(this._cellSize * 4 / 3),
                MSG.string_(RS.AreYouSureYouWantToCheat),
                (ok: boolean) => {
                    classlist.remove(K.xSelected);
                    if (ok) {
                        this.cheat_(cell, classlist);
                    }
                }).showAboveOrBelow_(cell);
            return;
        }
        this.open0(cell, classlist);
    }

    private cheat_(cell: Element, classlist: DOMTokenList): void {
        let row = Ut.parseInt_(cell.getAttribute(MK._row));
        let col = Ut.parseInt_(cell.getAttribute(MK._col));
        if (isNaN(row) || isNaN(col)) return;
        ++this._state._cheats;
        let ismine = this._state._bombs[row][col];
        if (ismine) {
            if (!this.clearFlag_(classlist)) this._state._flags += 1;
            classlist.add(MK.xxBomb);
            this.updateStatus_();
            return;
        }
        this.open1(row, col, cell, classlist);
    }

    private open0(cell: Element, classlist: DOMTokenList): void {
        let row = Ut.parseInt_(cell.getAttribute(MK._row));
        let col = Ut.parseInt_(cell.getAttribute(MK._col));
        if (isNaN(row) || isNaN(col)) return;
        let ismine = this._state._bombs[row][col];
        if (ismine) {
            if (!this.clearFlag_(classlist)) this._state._flags += 1;
            classlist.add(MK.xxOpen);
            classlist.add(MK.xxBomb);
            classlist.add(MK.xxGameover);
            this.gameover_();
            return;
        }
        this.open1(row, col, cell, classlist);
    }

    private toast_(msgid: string) {
        this._label.textContent = MSG.string_(msgid);
    }

    private gameover_(): void {
        this._state._gameover = true;
        this._map.classList.add(MK.xxGameover);
        this._label.classList.add(MK.xxGameover);
        this.toast_(RS.GameOver);
        this.gameover1();
    }

    private gameover1() {
        let children = this._map.children;
        for (let r = 0; r < this._state._rows; ++r) {
            let row = children[r];
            let cells = row.children;
            for (let c = 0; c < this._state._cols; ++c) {
                let cell = cells[c];
                let classlist = cell.classList;
                let isbomb = this._state._bombs[r][c];
                if (isbomb && !classlist.contains(MK.xxBomb)) {
                    if (this._state._victory) {
                        classlist.remove(MK.xxFlag);
                        classlist.add(MK.xxBomb);
                    } else if (!classlist.contains(MK.xxFlag)) {
                        classlist.add(MK.xxBomb);
                    }
                } else if (!isbomb && classlist.contains(MK.xxFlag)) {
                    classlist.add(MK.xxWrong);
                }
            }
        }
    }
}

MinesGame.startGame();
