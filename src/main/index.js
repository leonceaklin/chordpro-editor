import {
  app, BrowserWindow, ipcMain, dialog, Menu, MenuItem
} from 'electron';
import { parseSourceCode } from './renderer.js';
import { createServer, newContent } from './preview-server.js';
import { mainMenu } from './mainMenu.js';
import util from 'util';
export const i18n = require("i18n");

const axios = require('axios');

import ChordSheetJS from 'chordsheetjs';

i18n.configure({
    locales:['en', 'de'],
    directory: require("path").dirname(__dirname) + '/locales'
});



/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const baseURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/`
  : `file://${__dirname}/index.html#`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 800,
    useContentSize: true,
    width: 1000,
    minWidth: 800,
    minHeight: 600,
    vibrancy: 'dark',
    titleBarStyle: "hidden",
    background: "transparent",
    webPreferences: {
      backgroundThrottling: false,
      experimentalFeatures: true,
    },
    show: false,

  });


  mainWindow.loadURL(baseURL);
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  mainMenu(mainWindow);


  mainWindow.once('ready-to-show', () => {
    mainWindow.webContents.send('setMainView', 'EditorPage');
    setTimeout(function(){
      mainWindow.show();
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null
  });
}
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
});

ipcMain.on('newSourceCodeToParse', function(event, content) {
  const song = parseSourceCode(content);

  if(song != false){
    mainWindow.webContents.send('newParsedContent', song);
  }
});

ipcMain.on('reRenderMainEditorContent', function(event, content) {
  const song = parseSourceCode(content);

  if(song != false){
    mainWindow.webContents.send('mainEditorContentRendered', song.songBody);
  }
});

ipcMain.on('dictionaryTranslation', function(event, data){
  axios.get('https://'+data.translateFromLang+".wiktionary.org/w/api.php", {
    params: {
      titles: data.wordSearch,
      iwprefix: data.translateToLang,
      action: "query",
      prop: "iwlinks",
      format: "json",
      continue: "",
    }
  })
  .then(function (response) {
    console.log(response);
    mainWindow.webContents.send("dictionaryTranslationCallback", response);
  })
  .catch(function (error) {
    mainWindow.webContents.send("dictionaryTranslationCallback", error);
  })
});

ipcMain.on("showExportDialog", (type) => {
  var child = new BrowserWindow({
    parent: mainWindow,
    vibrancy: 'light',
    modal: true,
    visible: false,
  });
  child.loadURL(baseURL+"export");
  child.once('ready-to-show', () => {
    child.show();
  });
});

process.on('unhandledRejection', (reason, p) => {
 console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`);
});

const menu = new Menu()
menu.append(new MenuItem({ label: 'Chord', accelerator: "Command+K", click: () => { mainWindow.webContents.send("editorInsert", "chord") }}))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'Comment', click: () => { mainWindow.webContents.send("editorInsert", "comment") } }))

ipcMain.on('show-context-menu', (event, name, coordX, coordY) => {

  if (name == "insert-button") {
    const win = BrowserWindow.fromWebContents(event.sender)
    menu.popup(win, coordX, coordY);
  }
})

process.on('unhandledRejection', (reason, p) => {
  console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`);
});
