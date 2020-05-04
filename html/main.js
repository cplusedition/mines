/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

// Electron launcher.

const { app, BrowserWindow, Menu, isMac } = require('electron')

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: '&File',
            submenu: [
                {
                    "label": "&New Game",
                    role: 'reload'
                },
                {
                    label: isMac ? "&Close" : "&Quit",
                    role: isMac ? 'close' : 'quit'
                },
            ]
        }]));
    let c = parseInt(app.commandLine.getSwitchValue("c"));
    let d = parseInt(app.commandLine.getSwitchValue("d"));
    if (isNaN(c)) c = 28;
    if (isNaN(d)) d = 50;
    let search = `c=${c}&d=${d}`;
    win.loadFile('index.html', { "search": search });
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
