<template>
    <div class="chord-editor-container" ref="chordEditorContainer">
      <div class="chord-editor-popover">
        <div class="chord-name-container">
          <input v-model="chordName" @keydown="keydown" class="chord-name-input" ref="chordEditorInput" :placeholder="i18n.__('Name')">
          <div v-if="chordObject" class="note-play-button" v-on:click="playChord()"><span class="icon icon-play"></span></div>
        </div>


        <div class="chord-display-container">
          <agile>
            <div class="slide">
              <div ref="guitarChordContainer"></div>
            </div>
            <div class="slide">
              <div ref="notesChordContainer" class="notes-chord-container"></div>
            </div>
          </agile>
        </div>

        <div class="chord-editor-popover-arrow"></div>

        <div class="" style="display: none">
          <audio controls>
            <source src="../assets/sounds/piano/C3v16.wav" ref="samplerPianoC3" type="audio/wav">
            <source src="../assets/sounds/piano/C4v16.wav" ref="samplerPianoC4" type="audio/wav">
            <source src="../assets/sounds/piano/C5v16.wav" ref="samplerPianoC5" type="audio/wav">
            <source src="../assets/sounds/piano/C6v16.wav" ref="samplerPianoC6" type="audio/wav">
          </audio>
        </div>
      </div>
    </div>
</template>

<script>
import { messageBus } from '../main.js';
import teoria from "teoria";
import Tone from "tone";
import * as Vex from "vexflow";
import { i18n } from "../main.js";
export default {
    data: function(){
      return {
        visible: false,
        chordElement: '',
        chordName: '',
        chordObject: null,
        i18n: i18n,
      }
    },
    watch: {
      chordName: function(newName, oldName){
        var chordObject = null;

        try{
          chordObject = teoria.chord(newName);
        }catch(e){}

        if(chordObject != null){
          this.chordObject = chordObject;
        }
        else{
          this.chordObject = null;
        }

        this.drawNotesChord();

      }
    },
    methods: {
      openChordEditor(element){
        if(this.visible){
          this.applyChord();
        }

        var chordEditorContainer = this.$refs.chordEditorContainer;

        this.chordElement = element;
        this.chordName = element.innerHTML;

        var elementRect = element.getBoundingClientRect();
        console.log(elementRect);
        var pos = {};
        if(window.innerHeight-elementRect.top+elementRect.height <= elementRect.top){
          chordEditorContainer.classList.remove("beneath");
          pos.x = elementRect.left - 90;
          pos.y = elementRect.top-chordEditorContainer.getBoundingClientRect().height-10;
        }else{
          chordEditorContainer.classList.add("beneath");
          pos.x = elementRect.left - 90;
          pos.y = elementRect.top + elementRect.height + 10;
        }

        chordEditorContainer.style.top = pos.y + "px";
        chordEditorContainer.style.left = pos.x +"px";

        var chordEditorInput = this.$refs.chordEditorInput;
        chordEditorInput.focus();

        window.setTimeout(() => {
          chordEditorInput.setSelectionRange(0, this.chordName.length);
        }, 1);

          chordEditorContainer.classList.add("visible");

          this.visible = true;

      },
      closeChordEditor(){
        var chordEditorContainer = this.$refs.chordEditorContainer;
        chordEditorContainer.classList.remove("visible");
        this.applyChord();
        this.visible = false;
        this.$refs.chordEditorInput.blur();
      },
      applyChord(){
        this.chordElement.innerHTML = this.chordName;
        messageBus.$emit("triggerMainEditorEdited");
      },
      playChord(){
        var toneArray = []
        this.chordObject.notes().forEach(function(note){
          toneArray.push(note.name()+note.accidental()+note.octave());
        })

        this.sampler.triggerRelease();
        this.sampler.triggerAttackRelease(toneArray, "2n");
      },
      drawNotesChord(){
        var drawBassStave = false;

        var trebleChordNotes = [];
        var bassChordNotes = [];

        var trebleStaveNotes = [];
        var bassStaveNotes = [];

        this.chordObject.notes().forEach(function(note){
          if(note.octave() >= 4){
            trebleChordNotes.push(note);
          }else{
            bassChordNotes.push(note);
            drawBassStave = true;
          }
        })

        trebleChordNotes.forEach(function(note){
            trebleStaveNotes.push(note.name()+note.accidental()+"/"+note.octave());
        });

        bassChordNotes.forEach(function(note){
            bassStaveNotes.push(note.name()+note.accidental()+"/"+note.octave());
        });

        var defaultStyle = {
          fillStyle: 'black',
          strokeStyle: 'black',
        };

        var VF = Vex.Flow;

        var notesChordContainer = this.$refs.notesChordContainer;
        notesChordContainer.innerHTML = "";
        var renderer = new VF.Renderer(notesChordContainer, VF.Renderer.Backends.SVG);
        renderer.resize(160, 160);
        var context = renderer.getContext();

        // Draw Treble
        if(drawBassStave){
          var trebleStave = new VF.Stave(0, -20, 158);
        }else{
          var trebleStave = new VF.Stave(0, 30, 158);
        }
        trebleStave.addClef("treble");
        trebleStave.setStyle(defaultStyle);
        trebleStave.setContext(context).draw();
        console.log(trebleStaveNotes);
        var trebleNotes = [
          new VF.StaveNote({clef: "treble", keys: trebleStaveNotes, duration: "q" }),
        ];
        for (var i = 0; i < trebleChordNotes.length; i++) {
          var note = trebleChordNotes[i];
          if(note.accidental() != ""){
            trebleNotes[0].addAccidental(i, new Vex.Flow.Accidental(note.accidental()));
          }
        }
        var voice = new VF.Voice({num_beats: 1,  beat_value: 4});
        voice.addTickables(trebleNotes);
        var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 180);
        voice.draw(context, trebleStave);


        if(drawBassStave){
          var bassStave = new VF.Stave(0, 70, 158);
          bassStave.addClef("bass");
          bassStave.setStyle(defaultStyle);
          bassStave.setContext(context).draw();

          var bassNotes = [
            new VF.StaveNote({clef: "bass", keys: bassStaveNotes, duration: "q" }),
          ];
          for (var i = 0; i < bassChordNotes.length; i++) {
            var note = bassChordNotes[i];
            if(note.accidental() != ""){
              bassNotes[0].addAccidental(i, new Vex.Flow.Accidental(note.accidental()));
            }
          }
          var voice = new VF.Voice({num_beats: 1,  beat_value: 4});
          voice.addTickables(bassNotes);
          var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 160);
          voice.draw(context, bassStave);
        }


      },
      keydown(e){
        if(e.code == "Enter"){
          this.playChord();
        }
      },
      getChordElementKey(){
        var allChordElements = document.getElementById("mainEditorElement").getElementsByClassName("chord");
        for (var i = 0; i < allChordElements.length; i++) {
          if(allChordElements[i] == this.chordElement){
            return i;
          }
        }
      },
      editNextChord(){
        var n = document.getElementById("mainEditorElement").getElementsByClassName("chord");
        var chordElementKey = this.getChordElementKey();

        if(n.length > chordElementKey+1){
          this.openChordEditor(document.getElementById("mainEditorElement").getElementsByClassName("chord")[chordElementKey+1]);
        }
      },
      editPreviousChord(){
        var chordElementKey = this.getChordElementKey();

        if(0 < chordElementKey){
          this.openChordEditor(document.getElementById("mainEditorElement").getElementsByClassName("chord")[chordElementKey-1]);
        }
      },
    },
    mounted: function() {
      messageBus.$on('openChordEditor', (element) => {
        this.openChordEditor(element);
      });

      window.addEventListener('scroll', (e) => {
        this.closeChordEditor();
      });

      window.addEventListener('resize', (e) => {
        this.closeChordEditor();
      });

      window.addEventListener('click', (e) => {
        if(e.target.classList.contains("chord")){
          return;
        }
        if(this.$refs.chordEditorContainer.contains(e.target)){
          return;
        }
        this.closeChordEditor();
      });

        var sampler = new Tone.Sampler({
          "C3" : this.$refs.samplerPianoC3.src,
        	"C4" : this.$refs.samplerPianoC4.src,
          "C5" : this.$refs.samplerPianoC5.src,
          "C6" : this.$refs.samplerPianoC6.src,
        }).toMaster();
        sampler.release = 2;

        this.sampler = sampler;
    }
}
</script>

<style>
.chord-editor-container{
  position: absolute;
  width: 200px;
  height: 300px;
  pointer-events: none;
  z-index: 20;
  transition: none;
}

.chord-editor-container.visible{
  pointer-events: all;
  transition: all .2s ease-out;
}

.chord-editor-popover-arrow{
  width: 50px;
  height: 25px;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  overflow: hidden;
}

.beneath .chord-editor-popover-arrow{
  top: 0;
  transform: rotate(180deg) translateX(50%) translateY(100%);
}


.chord-editor-popover-arrow::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgb(245,245,245);
  transform: translateX(-50%) translateY(-60%) rotate(45deg);
  top: 0;
  left: 50%;
  box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  border: 1px solid lightgray;
}

.beneath .chord-editor-popover-arrow::after {
  box-shadow: -1px -1px 10px 0px rgba(0, 0, 0, 0.3);
}


.chord-editor-popover{
  height: 100%;
  width: 100%;
  top: 50%;
  left: 50%;
  background: rgb(245,245,245);
  box-shadow: 0px 3px 15px 0px rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  transform: scale(0);
  opacity: 0;
  transition: all .2s cubic-bezier(0, 0, 0.2, 1.3);
  transform-origin: bottom center;
  border: 1px solid lightgray;
}

.chord-editor-container.beneath .chord-editor-popover{
  transform-origin: top center;
}

.chord-editor-container.visible .chord-editor-popover{
  transform: scale(1);
  opacity: 1;
}

.chord-name-input{
  border: 0;
  width: 80%;
  font-size: 30px;
  margin: auto;
  margin-top: 10px;
  margin-left: 10%;
  text-align: center;
  outline: 0;
  background: transparent;
}

.chord-name-container{
  position: relative;
}

.notes-chord-container svg{
  margin-left: 20px;
  margin-right: 20px;
}

.note-play-button{
  opacity: .6;
  display: inline-block;
  font-size: 20px;
  position: absolute;
  right: 0px;
  padding: 20px;
}

.chord-display-container{
  margin-top: 10px;
}

.note-play-button:active{
  opacity: .8;
}

</style>
