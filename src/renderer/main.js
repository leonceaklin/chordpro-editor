import Vue from 'vue';
import App from './App';
import VueRouter from 'vue-router'
import util from 'util';
const { ipcRenderer, Menu, MenuItem, ipcMain, app } = require('electron');

import "xel/themes/macos.css";
import "xel/xel.min.js";

export const i18n = require("i18n")

i18n.configure({
    locales:['en', 'de'],
    directory: require("path").dirname(__dirname) + '/locales'
});



import "@/assets/css/photon/css/photon.min.css"

import EditorPage from "./components/EditorPage.vue";
import ExportDialog from "./components/ExportDialog.vue";

Vue.use(VueRouter)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

export const messageBus = new Vue({
  methods: {
    newSourceCodeToParse(newContent) {
      ipcRenderer.send('newSourceCodeToParse', newContent);
    },
    reRenderMainEditorContent(newContent) {
      ipcRenderer.send('reRenderMainEditorContent', newContent);
    },
    saveCurrentFile() {  },
    showContextMenu(name, coordX, coordY) {
      ipcRenderer.send("show-context-menu", name, coordY, coordX)
    },
  }
});

ipcRenderer.on('newParsedContent', (event, content) => {
  messageBus.$emit('setSongMeta', content.songMeta);
  console.log(content.songMeta.title);
  messageBus.$emit('updateMainEditor', content.songBody);
});

ipcRenderer.on('mainEditorContentRendered', (event, content) => {
  messageBus.$emit('mainEditorContentRendered', content);
});

ipcRenderer.on('newFile2Edit', (event) => {
  console.log(`ipcRenderer.on newFile2Edit ${util.inspect(event)}`);
  messageBus.$emit('newFile2Edit');
});

ipcRenderer.on('editorDoUndo', (event) => {
  console.log(`ipcRenderer.on editorDoUndo ${util.inspect(event)}`);
  messageBus.$emit('editorDoUndo');
});

ipcRenderer.on('editorDoRedo', (event) => {
  console.log(`ipcRenderer.on editorDoRedo ${util.inspect(event)}`);
  messageBus.$emit('editorDoRedo');
});

ipcRenderer.on('editorSelectAll', (event) => {
  console.log(`ipcRenderer.on editorSelectAll ${util.inspect(event)}`);
  messageBus.$emit('editorSelectAll');
});

ipcRenderer.on('openNewFile', (event, file2open) => {
  console.log(`ipcRenderer.on openNewFile  ${util.inspect(file2open)}`);
  messageBus.$emit('openNewFile', file2open);
});

ipcRenderer.on('saveCurrentFile', (event) => {
  console.log(`ipcRenderer.on saveCurrentFile ${util.inspect(event)}`);
  messageBus.$emit('saveCurrentFile');
});

ipcRenderer.on('showExportDialog', (event, type) => {
  messageBus.$emit('showExportDialog', type);
  ipcRenderer.send('showExportDialog', type);
});

ipcRenderer.on('editorInsert', (event, thing) => {
  messageBus.$emit('editorInsert', thing);
})

// 1. Define route components.
// These can be imported from other files


// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// `Vue.extend()`, or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/', component: EditorPage },
  { path: '/export', component: ExportDialog }
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  routes // short for `routes: routes`
})

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
