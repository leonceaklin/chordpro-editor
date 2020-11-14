<template>

<div id="wrapper" :class="[sidebarPanel != '' ? 'sidebar-visible' : '']">
<header class="toolbar toolbar-header">
  <h1 class="title">{{ songMeta.title ? songMeta.title : i18n.__("Untitled") }} – Chordpro Editor</h1>

  <div class="toolbar-actions">
    <button class="btn btn-default btn-dropdown pull-middle" @click="showInsertButtonContextMenu" title="Insert…">
      <span class="icon icon-plus" title="insert"></span>
    </button>

    <div class="btn-group pull-right wide-buttons">
      <button class="btn btn-default" :class="[sidebarPanel == 'format' ? 'active' : '']" ref="sidebarFormatButton" @click="toggleSidebar('format')">
        <span class="icon icon-brush"></span>
      </button>
      <button class="btn btn-default" :class="[sidebarPanel == 'dictionary' ? 'active' : '']" ref="sidebarDictionaryButton" @click="toggleSidebar('dictionary')">
        <span class="icon icon-book"></span>
      </button>
      <button class="btn btn-default" :class="[sidebarPanel == 'meta' ? 'active' : '']" ref="sidebarMetaButton" @click="toggleSidebar('meta')">
        <span class="icon icon-note-beamed"></span>
      </button>
    </div>
  </div>
</header>

  <div class="editors-container" ref="editorsContainer">
    <div id="sourceEditor" class="source-editor">
        <source-editor
            id="acesourceEditor"
            ref="acesourceEditor"
            v-model="input"
            @init="sourceEditorInit"
            theme="xcode"></source-editor>

    </div>

    <div id="mainEditor" class="main-editor" @focus="editorFocus = 'main'">
    <main-editor></main-editor>
    </div>
    </div>


    <chord-editor></chord-editor>



    <div ref="sideBarContainer" class="side-bar-container">
      <side-bar></side-bar>
    </div>

    <section class="status-bar columns" style="display: none;">
        <span class="status-item column tag is-info">{{ fileName }}</span>
        <span class="status-item column tag is-info">{{ input.length }} bytes</span>
        <span class="status-item column tag is-info">{{ isChangedFile ? "CHANGED" : "" }}</span>
        <span class="status-item column tag is-info">{{ isNewFile ? "NEW" : "" }}</span>
    </section>
</div>

</template>


<script>

import { messageBus } from '../main.js';

import fs from 'fs-extra';
import util from 'util';
import MainEditor from "../components/MainEditor.vue";
import SideBar from "../components/SideBar.vue";
import ExportDialog from '../components/ExportDialog.vue';
import ChordEditor from '../components/ChordEditor.vue';
import { i18n } from "../main.js"
import Vue from 'vue'


export default {
    data: function() {
        return {
            input: '{title: New Song}\n[D]Hello [C]World',
            isNewFile: true,
            isChangedFile: false,
            fileName: "",
            songMeta: {
              title: "",
              subtitle: "",
              artist: "",
              composer: "",
              lyricist: "",
              copyright: "",
              album: "",
              year: "",
              key: "",
              time: "",
              tempo: "",
              duration: "",
              capo: "",
              meta: [],
            },
            songBody: "",
          metaTypes: [
            {property: "title", name: i18n.__("Title"), placeholder: i18n.__("Song title")},
            {property: "subtitle", name: i18n.__("Subtitle"), placeholder: i18n.__("Song subtitle")},
            {property: "artist", name: i18n.__("Artist"), placeholder: i18n.__("Name")},
            {property: "composer", name: i18n.__("Composer"), placeholder: i18n.__("Name")},
            {property: "lyricist", name: i18n.__("Lyricist"), placeholder: i18n.__("Name")},
            {property: "copyright", name: i18n.__("Copyright"), placeholder: i18n.__("Copyright info")},
            {property: "album", name: i18n.__("Album"), placeholder: i18n.__("Name")},
            {property: "year", name: i18n.__("Year"), placeholder: i18n.__("Release year"), type: "number"},
            {property: "key", name: i18n.__("Key"), placeholder: i18n.__("Song key")},
            {property: "time", name: i18n.__("Time"), placeholder: i18n.__("Time"), type: "time"},
            {property: "tempo", name: i18n.__("Tempo"), placeholder: i18n.__("in bpm"), type: "number"},
            {property: "duration", name: i18n.__("Duration"), placeholder: i18n.__("Time"), type: "time"},
            {property: "capo", name: i18n.__("Capo"), placeholder: i18n.__("Capo information")},
            {property: "meta", name: i18n.__("Meta")},
          ],
          i18n: i18n,
          updateMainEditor: true,
          sidebarPanel: "",
        };
    },
    components: {
        sourceEditor: require('vue2-ace-editor'),
        mainEditor: MainEditor,
        sideBar: SideBar,
        chordEditor: ChordEditor,
    },
    watch: {
        input: function(newContent, oldContent) {
          this.isChangedFile = true;
          if(this.updateMainEditor){
            console.log("Source Editor updated by user");
            messageBus.newSourceCodeToParse(this.input);
          }
          else{
            this.updateMainEditor = true;
          }
        },
    },
    computed: {
        sourceEditor() { return this.$refs.aceEditor; },
    },
    methods: {
        sourceEditorInit(sourceEditor) {
            require('brace/ext/language_tools');
            require('brace/mode/chordpro');
            require('brace/theme/xcode');
            sourceEditor.setWrapBehavioursEnabled(true);
            sourceEditor.setShowInvisibles(true);
            sourceEditor.setShowFoldWidgets(true);
            sourceEditor.setShowPrintMargin(false);
            sourceEditor.getSession().setUseWrapMode(true);
            sourceEditor.getSession().setUseSoftTabs(true);
            sourceEditor.getSession().setMode("ace/mode/chordpro");
            messageBus.newSourceCodeToParse(this.input);
        },
        sourceEditorContentCut() {
            let selected = this.sourceEditor.sourceEditor.getSelection();
            if (! selected.isEmpty()) {
                let selectedRange = this.sourceEditor.sourceEditor.getSelectionRange();
                this.sourceEditor.sourceEditor.getSession().getDocument().replace(selectedRange, '');
            }
            this.$nextTick(() => {
                this.sourceEditor.sourceEditor.focus();
            });
        },
        askSaveFile(file2save) {
            return new Promise((resolve, reject) => {
                this.$dialog.confirm({
                    title: `Save File?`,
                    message: `${file2save}`,
                    cancelText: 'No',
                    confirmText: 'Yes',
                    onCancel: () => { resolve("cancel"); },
                    onConfirm: () => { resolve("confirm"); }
                })
            });
        },
        async saveContentToFile(file2save) {
            return await fs.writeFile(file2save, this.input, 'utf8');
        },
        saveAsGetFileName() {
            const remote = this.$electron.remote;
            const dialog = remote.dialog;
            console.log(`saveAsGetFileName ASKING SAVE TO`);
            return new Promise((resolve, reject) => {
                try {
                    dialog.showSaveDialog({
                        title: "Save",
                        filters: [ {
                            name: "Text Files",
                            extensions: [ "txt" ]
                        }]
                    }, filename => {
                        console.log(`saveAsGetFileName GOT SAVE TO ${filename}`);
                        resolve(filename);
                    });
                } catch (err) { reject(err); }
            });
        },
        async openNewFile() {
            if (this.isNewFile && this.isChangedFile) {
                console.log(`openNewFile isNewFile isChangedFile UNTITLED`);
                let doit = await this.askSaveFile('UNTITLED');
                if (doit === "confirm") {
                    let fileName = await this.saveAsGetFileName();
                    try { await this.saveContentToFile(fileName); } catch (e) {
                        console.error(`openNewFile saveContentToFile FAIL because for ${fileName} ${e.stack}`);
                    }
                }
            } else if (this.isChangedFile) {
                console.log(`openNewFile isChangedFile ${this.fileName}`);
                let doit = await this.askSaveFile(this.fileName);
            }
            console.log(`openNewFile BEFORE showOpenDialog`);
            let file2open = await new Promise((resolve, reject) => {
                const remote = this.$electron.remote;
                const dialog = remote.dialog;
                dialog.showOpenDialog({
                    properties: [ 'openFile' ],
                    title: "Open document",
                    filters: [ {
                        name: "Chordpro Files",
                        extensions: [ "chordpro" ]
                    },
                    {
                        name: "Text Files",
                        extensions: [ "txt" ]
                    } ]
                }, filePaths => {
                    if (filePaths) {
                        console.log(`openNewFile showOpenDialog ${filePaths[0]}`);
                        resolve(filePaths[0]);
                    } else resolve(undefined);
                });
            });
            console.log(`openNewFile READING1 ${file2open}`);
            if (!file2open) return;
            await new Promise((resolve, reject) => {
                console.log(`openNewFile READING2 ${file2open}`);
                fs.readFile(file2open, 'utf8', (err, text) => {
                    if (err) reject(err);
                    else {
                        this.isNewFile = false;
                        this.isChangedFile = false;
                        this.fileName = file2open;
                        this.input = text;
                        console.log(`openNewFile readFile ${file2open}`);
                        resolve();
                    }
                });
            });
        },
        async saveCurrentFile() {
            let p;
            let fileName;
            if (this.isNewFile && this.isChangedFile) {
                fileName = await this.saveAsGetFileName();
                console.log(`saveCurrentFile saveAsGetFileName ${fileName}`);
                if (!fileName) return;
            } else if (this.isChangedFile) {
                fileName = this.fileName;
            } else return;
            try { await this.saveContentToFile(fileName); } catch (e) {
                console.error(`saveCurrentFile saveContentToFile FAIL for ${fileName} because ${e.stack}`);
            }
            this.isNewFile = false;
            this.isChangedFile = false;
            this.fileName = fileName;
        },
        async newFile2Edit() {
            let p;
            if (this.isNewFile && this.isChangedFile) {
                console.log(`openNewFile isNewFile isChangedFile UNTITLED`);
                let doit = await this.askSaveFile('UNTITLED');
                if (doit === "confirm") {
                    let fileName = await this.saveAsGetFileName();
                    try { await this.saveContentToFile(fileName); } catch (e) {
                        console.error(`newFile2Edit saveContentToFile FAIL for ${fileName} because ${e.stack}`);
                    }
                }
            } else if (this.isChangedFile) {
                console.log(`openNewFile isChangedFile ${this.fileName}`);
                let doit = await this.askSaveFile(this.fileName);
                if (doit === "confirm") {
                    try { await this.saveContentToFile(this.fileName); } catch (e) {
                        console.error(`newFile2Edit saveContentToFile FAIL for ${fileName} because ${e.stack}`);
                    }
                }
            }
            this.isNewFile = true;
            this.isChangedFile = false;
            this.fileName = undefined;
            this.input = "[D]Hello [C]World";
        },
        showInsertButtonContextMenu(event){
          var rect = event.target.getBoundingClientRect();
          messageBus.showContextMenu("insert-button", parseInt(rect.top)+event.target.offsetHeight+5, parseInt(rect.left));
        },
        toggleSidebar(panel){
          if(panel == this.sidebarPanel){
            this.sidebarPanel = "";
          }
          else{
            this.sidebarPanel = panel
          }

        },
        generateSourceCode(songMeta, songBody, oldSourceCode){

            var newSourceCode = "";

            //Write Meta Elements
            var metaTypes = this.metaTypes;

            if(metaTypes !== undefined){
            for (var i = 0; i < metaTypes.length; i++) {
              var metaTypeProp = metaTypes[i].property;
              var meta = songMeta[metaTypeProp];

            if(meta != undefined){
              if(meta.length > 0){
                newSourceCode = newSourceCode+"{"+metaTypeProp+": "+meta+"}"+"\n";
              }
            }
            }
            }

            newSourceCode = newSourceCode+songBody;


            return newSourceCode;
        }
    },
    created: function() {
        messageBus.$on('newFile2Edit', () => { this.newFile2Edit(); });
        messageBus.$on('editorDoUndo',    () => { this.sourceEditor.editor.undo();      });
        messageBus.$on('editorDoUndo',    () => { this.sourceEditor.editor.redo();      });
        messageBus.$on('editorDoUndo', () => { this.sourceEditor.editor.selectAll(); });
        messageBus.$on('openNewFile', async (file2open) => {
            try { this.openNewFile(); } catch (err) {
                console.error(`openNewFile ERROR ${file2open} ${err.stack}`);
            }
        });
        messageBus.$on('saveCurrentFile', () => {
            try { this.saveCurrentFile(); } catch (err) {
                console.error(`saveCurrentFile ERROR ${file2open} ${err.stack}`);
            }
        });
        messageBus.$on('setSongMetaVariable', (name, value) => {
          this.songMeta[name] = value;
          console.log("Changed "+name+" to "+this.songMeta[name]);
        })
        messageBus.$on('setSongMeta', (songMeta) => {
          this.songMeta = songMeta;
        })
        messageBus.$on('setSongBody', (body) => {
          this.songBody = body;
        })
        messageBus.$on('updateSourceEditor', (songMeta, songBody) => {
          this.updateMainEditor = false;
          if(songMeta === undefined){
            var songMeta = this.songMeta;
          }
          if(songBody === undefined){
            var songBody = this.songBody;
          }
          this.input = this.generateSourceCode(songMeta, songBody, this.input);
        })
        messageBus.$on("showExportDialog", (type) => {

        })
        messageBus.$on("prepareReRenderMainEditorContent", () => {
          messageBus.reRenderMainEditorContent(this.input);
        })
    },
}
</script>

<style>
  #app{
    height: 100%;
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
  }
</style>

<style scoped>
  #wrapper {
      height: 100%;
      min-height: 100%;
  }

  .toolbar-header {
      -webkit-app-region: drag;
  }

  .source-editor {
      position: absolute;
      top: 0px;
      bottom: 0px;
      width: 50%;
      margin-bottom: 0px;
      border-right: solid 1px lightgray;
  }

  .main-editor {
      position: absolute;
      bottom: 0px;
      right: 0px;
      margin: 0px;
      width: 50%;
      margin-bottom: 0px;
      height: 100%;
      overflow: scroll;
      min-height: 100%;
      box-sizing: border-box;
  }

  .ace-editor {
      height: 100%;
      min-height: 100%;
  }

  .btn-dropdown .icon{
    pointer-events: none;
  }

  .status-bar {
      position: absolute;
      height: 30px;
      right: 0px;
      left: 0px;
      bottom: 0px;
      margin: 0px;
  }

  .status-bar .status-item {
      vertical-align: middle;
      /* margin-bottom: 5px; */
  }

  .editors-container{
    position: relative;
    overflow: visible;
    height: 100%;
    width: 100%;
    transition: width .2s ease-out;
    background: white;
  }

  .sidebar-visible .editors-container{
    width: calc(100% - 400px);
  }

  .side-bar-container{
    width: 400px;
    position: absolute;
    height: calc(100% - 69px);
    background: rgb(240, 240, 240);
    right: 0px;
    top: 69px;
    transition: transform .2s ease-out;
    transform: translateX(400px);
    border-left: solid 1px lightgray;
  }

  .sidebar-visible .side-bar-container{
    transform: none;
  }

</style>
