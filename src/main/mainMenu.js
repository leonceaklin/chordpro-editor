
import { app, Menu, dialog } from 'electron';
import fs from 'fs-extra';
import { i18n } from './index.js';

export function mainMenu(mainWindow) {
    const menuTemplate = [ {
          label: 'File',
          submenu: [
            {
                label: 'New',
                accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
                click: () => {
                    mainWindow.webContents.send('newFile2Edit');
                }
            },
            {
                label: 'Open',
                accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
                click: () => {
                    mainWindow.webContents.send('openNewFile');
                }
            },
            {
                label: 'Save',
                accelerator: process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
                click: () => {
                    mainWindow.webContents.send('saveCurrentFile');
                }
            },
            {
                label: 'Export',
                submenu: [
                {
                  label: i18n.__('PDF')+' …',
                  click: () => { mainWindow.webContents.send("showExportDialog", "pdf") }
                },
                {
                  label: i18n.__('Text')+' …',
                  click: () => { mainWindow.webContents.send("showExportDialog", "txt") }
                },
                {
                  label: i18n.__('HTML')+' …',
                  click: () => { mainWindow.webContents.send("showExportDialog", "html") }
                },
                ]
            },
          ]
        },
        {
            label: 'Edit',
            submenu: [
              {
                  label: 'Undo',
                  accelerator: process.platform === 'darwin' ? 'Command+Z' : 'Ctrl+Z',
                  click: () => { mainWindow.webContents.send('editorDoUndo'); }
              },
              {
                label: 'Redo',
                accelerator: process.platform === 'darwin' ? 'Command+Shift+Z' : 'Ctrl+Shift+Z',
                click: () => { mainWindow.webContents.send('editorDoRedo'); }
              },
              {type: 'separator'},
              {role: 'cut'},
              {role: 'copy'},
              {role: 'paste'},
              {role: 'pasteandmatchstyle'},
              {role: 'delete'},
              {
                  label: 'Select All',
                  accelerator: process.platform === 'darwin' ? 'Command+A' : 'Ctrl+A',
                  click: () => { mainWindow.webContents.send('editorSelectAll'); }
              }
            ]
        },
        {
            label: 'Insert',
            submenu: [
              {
                  label: i18n.__('Chord'),
                  accelerator: process.platform === 'darwin' ? 'Command+K' : 'Ctrl+K',
                  click: () => { mainWindow.webContents.send('editorInsert', 'chord'); }
              },
              {
                label: i18n.__('Comment'),
                  click: () => { mainWindow.webContents.send('editorInsert', 'comment'); }
              },
            ]
        },
        {
            label: 'View',
            submenu: [
              {role: 'reload'},
              {role: 'forcereload'},
              {role: 'toggledevtools'},
              {type: 'separator'},
              {role: 'resetzoom'},
              {role: 'zoomin'},
              {role: 'zoomout'},
              {type: 'separator'},
              {role: 'togglefullscreen'}
            ]
        },
        {
            role: 'window',
            submenu: [
              {role: 'minimize'},
              {role: 'close'}
            ]
        }
    ];

    if (process.platform === 'darwin') {
        menuTemplate.unshift({
            label: app.getName(),
            submenu: [
              {role: 'about'},
              {type: 'separator'},
              {role: 'services', submenu: []},
              {type: 'separator'},
              {role: 'hide'},
              {role: 'hideothers'},
              {role: 'unhide'},
              {type: 'separator'},
              {
                role: 'quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q'
              }
            ]
        });
    }

    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
};
