<template>
  <div class="main-editor-container" @click="focusMainEditor">
    <input v-bind:value="this.$parent.songMeta.title" v-on:input="setSongMetaVariable('title', $event.target.value)" class="song-title-input" placeholder="Song title">
    <div class="main-editor-element"
          id="mainEditorElement"
          ref="mainEditorElement"
          v-on:input="mainEditorEdited"
          v-on:keydown="checkNewInputOnKeydown"
          v-on:keyup="checkNewInputOnKeyup"
          contenteditable="true"></div>
  </div>
</template>

<script>
import { messageBus, i18n } from '../main.js';


export default {
    data: function() {
        return {
          editorContent: "",
          i18n: i18n
        };
    },
    components: {
    },
    computed: {
      editorPage: function(){return EditorPage}
    },
    methods: {
        updateContent(content){
          if(content !== undefined){
            this.editorContent = content;
            this.$refs.mainEditorElement.innerHTML = content;
          }
          else{
            var content = this.$refs.mainEditorElement.innerHTML;
          }

          this.cleanupContent();
          var songBody = this.parseContent();

          if(this.$parent.songBody != songBody){
            this.setSongBody(this.parseContent());
          }
        },
        updateReRenderedContent(content){
          this.editorContent = content;
          this.$refs.mainEditorElement.innerHTML = content;
          this.cleanupContent();
          this.setCursor(this.savedCursorPosition);
        },
        cleanupContent(e){
          var editorElement = this.$refs.mainEditorElement;

          //Prepare Chord Elements
          var chordElements = editorElement.getElementsByClassName("chord");
          for (var i = 0; i < chordElements.length; i++) {
            var chordElement = chordElements[i];
            chordElement.addEventListener("click", this.openChordEditor);
          }

          //ContentEditable to false for the following Elements
          var notEditableElements = editorElement.querySelectorAll(".chord");
          for (var i = 0; i < notEditableElements.length; i++) {
            var notEditableElement = notEditableElements[i];
            notEditableElement.setAttribute("contenteditable", false);
          }

          //Remove the rest
          var columnElements = editorElement.getElementsByClassName("column");

          for (var i = 0; i < columnElements.length; i++) {
            var columnElement = columnElements[i];
            if(columnElement.innerText == ""){
              if(columnElement.parentNode.children.length > 1){
                columnElement.remove();
                i = i-1;
              }
            }
          }

          var brElements = editorElement.getElementsByTagName("br");
          while(brElements.length){
            brElements[0].remove();
          }

          //Remove the rest
          var removableContainers = editorElement.getElementsByTagName("span");
          while(removableContainers.length){
            var removableContainer = removableContainers[0];
            this.unwrapElement(removableContainer);
          }

          if(e !== undefined){
            var cursorParent = this.getCursorParent();
            if(cursorParent !== undefined){

              //Move Text with Cursor if not inside Lyrics or Comment
              if(!cursorParent.classList.contains("comment") && !cursorParent.classList.contains("lyrics") && cursorParent.innerText != ""){
                console.log("Check");
                var cursorPosition = this.getSelectionRange().end;
                console.log(cursorParent);

                var insert = false;
                var directChild;

                //If in main editor (Omg) -> Make Chordsheet
                if(cursorParent.classList.contains("main-editor-element")){
                  var chordSheetElement = cursorParent.querySelectorAll(".chord-sheet")[0];
                  if(chordSheetElement === undefined){
                    var chordSheetElement = document.createElement("div");
                    chordSheetElement.classList.add("chord-sheet");
                  }
                  insert = true;
                  directChild = chordSheetElement;
                }

                //If in Chordsheet -> Make Paragraph inside Chordsheet
                if(cursorParent.classList.contains("chord-sheet") || insert){
                  var paragraphElement = cursorParent.querySelectorAll(".paragraph")[0];
                  if(paragraphElement === undefined){
                    var paragraphElement = document.createElement("div");
                    paragraphElement.classList.add("paragraph");
                    if(insert){
                      chordSheetElement.appendChild(paragraphElement);
                    }
                  }
                  if(!insert){
                    directChild = paragraphElement;
                  }
                  insert = true;
                }

                //If in Paragraph -> Make Row inside Paragraph
                if(cursorParent.classList.contains("paragraph") || insert){
                  var rowElement = cursorParent.querySelectorAll(".row")[0];
                  if(rowElement === undefined){
                    var rowElement = document.createElement("div");
                    rowElement.classList.add("row");
                    if(insert){
                      paragraphElement.appendChild(rowElement);
                    }
                  }
                  if(!insert){
                    directChild = rowElement;
                  }
                  insert = true;
                }

                //If in row -> Make Column inside Row
                if(cursorParent.classList.contains("row") || insert){
                  var columnElement = cursorParent.querySelectorAll(".column")[0];
                  if(columnElement === undefined){
                    var columnElement = document.createElement("div");
                    columnElement.classList.add("column");
                    if(insert){
                      rowElement.appendChild(columnElement);
                    }
                  }
                  if(!insert){
                    directChild = columnElement;
                  }
                  insert = true;
                }

                //If in Column
                if(cursorParent.classList.contains("column") || insert){
                  var lyricsElement = cursorParent.querySelectorAll(".lyrics")[0];
                  if(lyricsElement === undefined){
                    var lyricsElement = document.createElement("div");
                    lyricsElement.classList.add("lyrics");
                    if(insert){
                      columnElement.appendChild(lyricsElement);
                    }
                  }

                  if(!insert){
                    directChild = lyricsElement;
                  }
                  lyricsElement.innerHTML = lyricsElement.innerText + cursorParent.innerText;
                  insert = true;
                }

                if(insert){
                  cursorParent.appendChild(directChild);
                  this.removeTextNodesInsideElement(cursorParent);
                  this.moveCursor(2);
                }

              }

            }
          }
        },
        openChordEditor(e){
          if(e.target !== undefined){
            e = e.target;
          }
          messageBus.$emit("openChordEditor", e);
        },
        setSongMetaVariable(name, value){
          messageBus.$emit('setSongMetaVariable', name, value);
          messageBus.$emit("updateSourceEditor");
        },
        setSongBody(body){
          messageBus.$emit('setSongBody', body);
        },
        mainEditorEdited(e){
          console.log("Main editor edited by user!");
          this.cleanupContent(e);
          var parsedContent = this.parseContent();
          this.setSongBody(parsedContent);
          messageBus.$emit("updateSourceEditor");
        },
        parseContent(){
          var editorElement = this.$refs.mainEditorElement;
          var parser = document.createElement("div");

          parser.innerHTML = editorElement.innerHTML;

          //Translate Chords
          var chordElements = parser.getElementsByClassName("chord");
          while(chordElements.length){
            var chordElement = chordElements[0];

            if(chordElement.innerHTML.length > 0){
              chordElement.innerHTML = "["+chordElement.innerHTML+"]";
            }
            this.unwrapElement(chordElement);
          }

          //Remove Row containers
          var rowElements = parser.getElementsByClassName("row");
          while(rowElements.length){
            var rowElement = rowElements[0];
            rowElement.innerHTML = rowElement.innerHTML+"\n";
            this.unwrapElement(rowElement);
          }

          //Translate Comments
          var rowElements = parser.getElementsByClassName("comment");
          while(rowElements.length){
            var rowElement = rowElements[0];
            rowElement.innerHTML = "{comment: "+rowElement.innerHTML+"}";
            this.unwrapElement(rowElement);
          }

          //Remove the rest
          var removableContainers = parser.getElementsByTagName("div");
          while(removableContainers.length){
            var removableContainer = removableContainers[0];
            this.unwrapElement(removableContainer);
          }

          var parsedContent = parser.innerHTML;

          parsedContent = parsedContent.replace("&nbsp;", " ");
          parsedContent = parsedContent.replace("&nbsp", " ");

          return parsedContent;
        },
        unwrapElement(wrapper){
          // place childNodes in document fragment
          var docFrag = document.createDocumentFragment();
          while (wrapper.firstChild) {
              var child = wrapper.removeChild(wrapper.firstChild);
              docFrag.appendChild(child);
          }

          // replace wrapper with document fragment
          wrapper.parentNode.replaceChild(docFrag, wrapper);
        },
        getCursorParent(){
          var el = document.createElement("div");
          el.setAttribute("style", "display: none");
          this.insertElementAtCursor(el);

          var parent = el.parentNode;
          el.remove();
          return parent;
        },
        removeTextNodesInsideElement(element){
          var childElements = element.children;
          var children = []
          for (var i = 0; i < childElements.length; i++) {
            children.push(childElements[i]);
          }

          element.innerHTML = "";
          for (var i = 0; i < children.length; i++) {
            element.appendChild(children[i]);
          }
        },
        checkNewInputOnKeydown(e){
          var generateIdentifier = Math.random;
          var prevent = false;

          console.log(this.getSelectionRange());

          //On Keycode Enter
          if(e.keyCode === 13){

            var parentElement = this.getCursorParent();

            if(parentElement.innerText != ""){
              var parentSelectionRange = this.getSelectionRange(parentElement);

              if(parentSelectionRange.start != parentSelectionRange.end){
                document.execCommand("delete");
              }

              var followingSiblings = [];
              var followingParentSiblings = [];

              if(parentElement.classList.contains("lyrics")){
                followingSiblings = this.getFollowingSiblings(parentElement);
                followingParentSiblings = this.getFollowingSiblings(parentElement.parentNode);

                var followingRowElement = parentElement.parentNode.parentNode.nextSibling;
              }

              var newRowRequired = true;

              if(followingRowElement !== undefined && followingRowElement != null){
                if(followingRowElement.innerText == ""){
                  newRowRequired = false;
                }
              }

              //If new row is required
              if(newRowRequired){
                var parentTextAfterCursor = parentElement.innerText.substr(parentSelectionRange.end);

                parentElement.innerHTML = parentElement.innerText.substr(0, parentSelectionRange.end);

                var rowElement = document.createElement("div");
                rowElement.classList.add("row");

                var columnElement = document.createElement("div");
                columnElement.classList.add("column");

                var lyricsElement = document.createElement("div");
                lyricsElement.classList.add("lyrics");
                lyricsElement.tabIndex = -1; //Makes the new lyrics element focusable
                lyricsElement.innerHTML = parentTextAfterCursor;

                rowElement.appendChild(columnElement);
                for (var i = 0; i < followingParentSiblings.length; i++) {
                  rowElement.appendChild(followingParentSiblings[i]);
                }

                columnElement.appendChild(lyricsElement);
                for (var i = 0; i < followingSiblings.length; i++) {
                  columnElement.appendChild(followingSiblings[i]);
                }

                var insertElement = parentElement;
                if(insertElement.classList.contains("lyrics")){
                  insertElement = insertElement.parentNode.parentNode;
                }
                else if(insertElement.classList.contains("column")){
                  insertElement = insertElement.parentNode;
                }

                insertElement.parentNode.insertBefore(rowElement, insertElement.nextSibling);

                this.focusElement(lyricsElement);
              }
              //If row exists already
              else{
                this.focusElement(followingRowElement);
              }
            }

            // prevent the default behaviour of return key pressed
            prevent = true;
          }

          else if(e.code == "Backspace"){
            var parentElement = this.getCursorParent();

            if(!parentElement.classList.contains("main-editor-element")){

              if(parentElement.classList.contains("lyrics")){
                parentElement = parentElement.parentNode;
              }

              if(parentElement.classList.contains("column")){
                parentElement = parentElement.parentNode;
              }

              if(this.getSelectionRange(parentElement).end == 0){
                var prevElement = parentElement.previousSibling;
                var cursorOffset = 1-parentElement.textContent.length;

                while(parentElement.children.length){
                  prevElement.appendChild(parentElement.children[0]);
                }
                parentElement.remove();

                this.moveCursor(cursorOffset);

                prevent = true;
              }

              if(parentElement.innerText == ""){
                parentElement.remove();
                prevent = true;
              }
            }
            else{
              prevent = true;
            }
          }

          var editorElement = e.target;

          if(prevent){
            e.preventDefault();
            this.mainEditorEdited();
            return false;
          }

        },
        checkNewInputOnKeyup(e){

        },
        createRange(node, chars, range) {
            if (!range) {
                range = document.createRange()
                range.selectNode(node);
                range.setStart(node, 0);
            }

            if (chars.count === 0) {
                range.setEnd(node, chars.count);
            } else if (node && chars.count >0) {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.length < chars.count) {
                        chars.count -= node.textContent.length;
                    } else {
                         range.setEnd(node, chars.count);
                         chars.count = 0;
                    }
                } else {
                    for (var lp = 0; lp < node.childNodes.length; lp++) {
                        range = this.createRange(node.childNodes[lp], chars, range);

                        if (chars.count === 0) {
                           break;
                        }
                    }
                }
           }

           return range;
        },
        moveCursor(pos){
          this.setCursor(this.getSelectionRange().end + pos);
        },
        getFollowingSiblings(el){
          var siblings = [];
          var next = el;
          while(next !== undefined && next !== null){
            var next = next.nextSibling;
            if (next !== undefined && next !== null) {
              siblings.push(next);
            }
          }

          return siblings;
        },
        setCursor(chars) {
          var element = this.$refs.mainEditorElement;
            if (chars >= 0) {
                var selection = window.getSelection();

                var range = this.createRange(element.parentNode, { count: chars });

                if (range) {
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

                element.focus();
            }
        },
        focusElement(element){
          let el = element;
          const range = window.document.createRange();
          range.setStart(el, 0);
          range.setEnd(el, 0);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        },
        insertHTMLAtCursor(html){
          document.execCommand('insertHTML', false, html);
        },
        insertElementAtCursor(element){
            var sel, range;
            if (window.getSelection) {
                sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode( element );
                }
            }
        },
        getSelectionRange(element){
          var start = 0;
          var end = 0;

          if(element === undefined){
            var element = this.$refs.mainEditorElement;
          }

          var doc = element.ownerDocument || element.document;
          var win = doc.defaultView || doc.parentWindow;
          var sel;
          if (typeof win.getSelection != "undefined") {
              sel = win.getSelection();
              if (sel.rangeCount > 0) {
                  var range = win.getSelection().getRangeAt(0);
                  var preCaretRange = range.cloneRange();
                  preCaretRange.selectNodeContents(element);
                  preCaretRange.setEnd(range.startContainer, range.startOffset);
                  start = preCaretRange.toString().length;
                  preCaretRange.setEnd(range.endContainer, range.endOffset);
                  end = preCaretRange.toString().length;
              }
          } else if ( (sel = doc.selection) && sel.type != "Control") {
              var textRange = sel.createRange();
              var preCaretTextRange = doc.body.createTextRange();
              preCaretTextRange.moveToElementText(element);
              preCaretTextRange.setEndPoint("EndToStart", textRange);
              start = preCaretTextRange.text.length;
              preCaretTextRange.setEndPoint("EndToEnd", textRange);
              end = preCaretTextRange.text.length;
          }
          return { start: start, end: end };
      },
        reRenderMainEditorContent(){
          this.savedCursorPosition = this.getSelectionRange().end+1;
          messageBus.$emit('prepareReRenderMainEditorContent');
        },
        insertChord(){
          var parentElement = this.getCursorParent();
          var validParentElement = parentElement.classList.contains("lyrics");

          if(!validParentElement){
            cleanupContent(true);
            var parentElement = this.getCursorParent();
            var validParentElement = this.getCursoeParent().classList.contains("lyrics");
          }


          if(validParentElement){
            var insertPosition = this.getSelectionRange(parentElement).start;
            var parentContent = parentElement.innerText;

            if(insertPosition > 0){
              var firstElementContent = parentContent.substr(0, insertPosition);
              var secondElementContent = parentContent.substr(insertPosition);

              parentElement.innerHTML = firstElementContent;

              var columnElement = document.createElement("div");
              columnElement.setAttribute("class", "column");

              var chordElement = document.createElement("div");
              chordElement.setAttribute("class", "chord");
              chordElement.setAttribute("contenteditable", false);

              var lyricsElement = document.createElement("div");
              lyricsElement.setAttribute("class", "lyrics");
              lyricsElement.innerHTML = secondElementContent;

              columnElement.appendChild(chordElement);
              columnElement.appendChild(lyricsElement);

              parentElement.parentNode.parentNode.insertBefore(columnElement, parentElement.parentNode.nextSibling);
              this.focusElement(lyricsElement);
            }
            else{
              var chordElement = parentElement.parentNode.getElementsByClassName("chord")[0];
              if(chordElement === undefined){
                var chordElement = document.createElement("div");
                chordElement.setAttribute("class", "chord");
                chordElement.setAttribute("contenteditable", false);
                parentElement.parentNode.insertBefore(chordElement, parentElement);
              }
              this.focusElement(parentElement);
            }
          }

          if(chordElement.innerHTML == ""){
            chordElement.innerHTML = "…";
          }

          this.cleanupContent();
          this.openChordEditor(chordElement);
        },
        focusMainEditor(){
        },
    },
    created: function() {
        messageBus.$on('updateMainEditor', (content) => {
            console.log(`updateMainEditor ${content}`);
            this.updateSourceEditor = false;
            this.updateContent(content);
        });
        messageBus.$on('reRenderMainEditorContent', (content) => {
            this.reRenderMainEditorContent();
        });
        messageBus.$on('updateSongContent', () => {
            this.updateContent();
        });
        messageBus.$on('mainEditorContentRendered', (content) => {
            this.updateReRenderedContent(content);
        });
        messageBus.$on('triggerMainEditorEdited', () => {
            this.mainEditorEdited();
        });
        messageBus.$on('editorInsert', (thing) => {
          if(thing == "chord"){
            this.insertChord();
          }
          if(thing == "comment"){
            this.insertComment();
          }
        })
    }
}
</script>

<style>
.main-editor-element{
  outline: 0px;
  min-height: 100%;
  margin-left: 10px;
}

.main-editor-container{
  box-sizing: border-box;
  position: relative;
  min-height: 100%;
}

.main-editor{
  font-size: 16px;
}

.main-editor .column{
  display: inline-block;
  padding: 2px;
}

.main-editor .lyrics{
  /* height: 20px; */
}

.toolbar-header .title{
  font-size: 13px;
  font-weight: 500;
  height: 16px;
  margin-bottom: 21px;
}

.main-editor .chord{
  opacity: .6;
}

.main-editor .comment{
  font-weight: 800;
  padding: 3px;
}

.song-title-input{
  outline: 0;
  font-size: 25px;
  font-weight: bold;
  border: 0px;
  width: 100%;
  padding: 10px;
}

.song-title-input::placeholder{
  color: rgba(0,0,0,0.2)
}
</style>
