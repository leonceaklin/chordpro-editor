<template>
<div>
<h1>{{ i18n.__('Dictionary') }}</h1>

<form>
  <div class="form-group">
    <input type="text" class="form-control" v-bind:disabled="processing" v-model="wordSearch" :placeholder="i18n.__('Your word')">
  </div>
  <div class="translation-fields" :class="[searchType == 'translation' ? '' : 'invisible']">
  <div class="form-group">
    <label>{{ i18n.__("From") }}</label>
    <select v-model="translateFromLang" class="form-control translation-select">
      <option v-for="lang in translationLanguages" :value="lang.code">{{ lang.name }}</option>
    </select>
    </div>
    <div class="form-group">
    <label>{{ i18n.__("To") }}</label>
    <select v-model="translateToLang" class="form-control translation-select">
      <option v-for="lang in translationLanguages" :value="lang.code">{{ lang.name }}</option>
    </select>
  </div>
  </div>
  <div class="form-group">
  <select v-model="searchType" class="form-control search-type-select">
    <option value="rel_rhy">{{ i18n.__('Perfect Rhyme') }}</option>
    <option value="rel_nry">{{ i18n.__('Approximate Rhyme') }}</option>
    <option value="rel_hom">{{ i18n.__('Homophone') }}</option>
    <option value="rel_cns">{{ i18n.__('Consonant match') }}</option>
    <option disabled></option>
    <option value="translation">{{ i18n.__('Translation') }}</option>
    <option disabled></option>
    <option value="rel_syn">{{ i18n.__('Synonym') }}</option>
    <option value="rel_ant">{{ i18n.__('Antonym') }}</option>
    <option value="rel_trg">{{ i18n.__('Trigger') }}</option>
    <option disabled></option>
    <option value="rel_jja">{{ i18n.__('Noun') }}</option>
    <option value="rel_jjb">{{ i18n.__('Adjective') }}</option>
    <option disabled></option>
    <option value="ml">{{ i18n.__('Word with familiar meaning') }}</option>
    <option value="sl">{{ i18n.__('Word with familiar sound') }}</option>
    <option value="rel_spc">{{ i18n.__('Word that describes the word') }}</option>
    <option value="rel_gen">{{ i18n.__('Word which is more general') }}</option>
    <option value="rel_com">{{ i18n.__('Word which comprises the word') }}</option>
    <option value="rel_par">{{ i18n.__('Word which is part of the word') }}</option>
    <option disabled></option>
    <option value="rel_bga">{{ i18n.__('Frequent follower') }}</option>
    <option value="rel_bgb">{{ i18n.__('Frequent predecessor') }}</option>
  </select>
  <button type="submit" :class="[wordSearch == '' || processing ? 'btn-default btn-disabled' : 'btn-primary']" @click="findWords" class="btn btn-form search-submit">{{ i18n.__('Search') }}</button>

  </div>
</form>

<div class="result-wrapper">
<div class="result-content">
<div v-if="searchResult.length > 0" class="table-container">
  <div class="scroller-wrapper" ref="scrollerWrapper" :class="[searchType == 'translation' ? 'minimized' : '']">
  <table class="table-striped">
  <thead>
    <tr>
      <th>{{ i18n.__('Word') }}</th>
      <th>{{ i18n.__('Score') }}</th>
      <th></th>
    </tr>
  </thead>
  </table>
  <div class="table-scroll-container">
    <table class="table-striped">
    <tbody>
      <tr v-for="result in searchResult">
        <td>{{ result.word }}</td>
        <td>{{ result.score }}</td>
        <td>
          <div class="action-buttons">
          <div class="search-button" @click="startSearchForWord(result.word)"><span class="icon icon-search"></span></div>
          <div class="copy-button" @click="copyToClipboard(result.word)"><span class="icon icon-popup"></span></div>
          <div class="insert-button"><span class="icon icon-plus"></span></div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
</div>
</div>
</div>

<div v-if="searchResult.length == 0" class="status-text">
{{ wordSearch != lastWordSearch || wordSearch == "" ? i18n.__('Type a word to search') : i18n.__('No word found') }}
</div>
</div>


</div>
</template>

<script>
import { messageBus, i18n } from '../main.js';
const datamuse = require('datamuse');
const axios = require('axios');
const { ipcRenderer, ipcMain } = require("electron");
const { clipboard } = require('electron')


export default {
    data: function(){
      return {
        i18n: i18n,
        wordSearch: "",
        searchType: "rel_rhy",
        lastWordSearch: "",
        lastSearchType: "",
        searchResult: [],
        processing: false,
        translateFromLang: "de",
        translateToLang: "en",
        lastTranslateToLang: "",
        lastTranslateFromLang: "",
        translationLanguages: [
          {name: i18n.__("German"), code: "de"},
          {name: i18n.__("English"), code: "en"},
          {name: i18n.__("French"), code: "fr"},
          {name: i18n.__("Italian"), code: "it"},
        ]
      }
    },
    watch:{
      searchType: function(val, oldVal){
        if(val == "translation" || oldVal == "translation"){
          this.$refs.scrollerWrapper.classList.add("transition");
          window.setTimeout(() => {
            this.$refs.scrollerWrapper.classList.remove("transition");
          }, 200)
        }
      }
    },
    methods: {
      findWords(e){
        if(e !== undefined){
          e.preventDefault();
        }
      if(this.wordSearch != "" && (this.wordSearch != this.lastWordSearch ||
          this.searchType != this.lastSearchType ||
          this.translateFromLang != this.lastTranslateFromLang ||
          this.translateToLang != this.lastTranslateToLang)){

        if(this.searchType != "translation"){
          this.processing = true;
          datamuse.words({
            [this.searchType]: this.wordSearch,
          })
          .then((json) => {
            this.processing = false;
            this.searchResult = json;
            console.log(this.searchResult);
            this.lastWordSearch = this.wordSearch;
            this.lastSearchType = this.searchType;
          });
        }
        else{
          ipcRenderer.send("dictionaryTranslation", {
            translateToLang: this.translateToLang,
            translateFromLang: this.translateFromLang,
            wordSearch: this.wordSearch,
          });

          this.processing = true;
        }
      }
    },
    startSearchForWord(word){
      this.wordSearch = word;
      this.findWords();
    },
    copyToClipboard(word){
      clipboard.writeText(word);
    }
    },
    mounted: function() {
      ipcRenderer.on('dictionaryTranslationCallback', (event, data) => {
        console.log(data);
        this.processing = false;
        this.lastTranslateFromLang = this.translateFromLang;
        this.lastTranslateToLang = this.translateToLang;

        var searchResult = [];
        var results = data.data.query.pages;

        for(var result in results){
          if(results.hasOwnProperty(result)){
            var result = results[result];
            if(result.hasOwnProperty("iwlinks")){
              for (var i = 0; i < result.iwlinks.length; i++) {
                var resultWord = result.iwlinks[i]["*"];
                resultWord = resultWord.replace("Special:Search/", "");
                resultWord = resultWord.replace("_", " ");
                searchResult.push({word: resultWord});
              }
            }
          }
        }

        this.searchResult = searchResult;
      });
    }
}
</script>

<style>
.sidebar-panel-wrapper h1{
  font-size: 30px;
  font-weight: 900;
  margin-top: 6px;
  margin-left: 10px;
  margin-bottom: 0px;
}

form, .table-container{
  padding: 10px;
  box-sizing: border-box;
}

.table-container, .scroller-wrapper{
  height: 100%;
}

.result-wrapper{
  height: calc(100% - 200px);
}

.result-content{
  height: 100%;
  position: relative;
}

.scroller-wrapper{
  height: calc(100vh - 69px - 170px);
}

.scroller-wrapper.minimized{
  height: calc(100vh - 69px - 170px - 90px);
}

.scroller-wrapper.transition{
  transition: height .2s ease;
}

.table-scroll-container{
  height: calc(100% - 24px);
  overflow: scroll;
  background: white;
}

.table-container .scroller-wrapper{
  border: 1px solid lightgray;
}

.table-container table{
  overflow: hidden;
}

.table-container tbody{
  max-height: 200px;
}

.btn-disabled{
  pointer-events: none;
  color: gray;
}

.search-type-select{
  width: calc(100% - 85px);
  height: 25px;
}

.translation-select{
  width: calc(100% - 60px);
  height: 25px;
  float: right;
}

.search-submit{
  float: right;
}

.disabled{
  pointer-events: none;
}

.translation-fields{
  height: 90px;
  transition: height .2s ease;
}

.translation-fields.invisible{
  height: 0px;
  overflow: hidden;
  pointer-events: none;
}

.status-text{
  padding: 10px;
  box-sizing: border-box;
  font-size: 20px;
  font-weight: 600;
  color: rgba(0,0,0,.5);
  text-align: center;
  position: absolute;
  top: 50%;
  margin-top: 20px;
  width: 100%;
}

.action-buttons{
  opacity: 0;
  pointer-events: none;
  float: right;
}

tr:hover .action-buttons{
  opacity: 1;
  pointer-events: all;
}

.action-buttons div{
  display: inline-block;
  padding-left: 10px;
  font-size: 15px;
  opacity: .7;
}

.action-buttons div:active{
  opacity: 1;
}
</style>
