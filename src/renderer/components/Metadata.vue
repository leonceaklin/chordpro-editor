<template>
<div class="wrapper">
<h1>{{ i18n.__('Metadata') }}</h1>

<form>
  <div class="form-group" v-for="metaType in editorComponent.metaTypes">
    <label>{{ metaType.name }}</label>
    <input :type="metaType.type || 'text'" class="form-control" v-bind:value="editorComponent.songMeta[metaType.property]" v-on:input="setSongMetaVariable(metaType.property, $event.target.value)" :placeholder="metaType.placeholder">
  </div>
</form>

</div>
</template>

<script>
import { messageBus, i18n } from '../main.js';

export default {
    data: function(){
      return {
        i18n: i18n,
        editorComponent: this.$parent.$parent
      }
    },
    methods: {
      setSongMetaVariable(name, value){
        messageBus.$emit('setSongMetaVariable', name, value);
        messageBus.$emit("updateSourceEditor");
      },
    },
    mounted: function() {
      console.log(this.$parent.editorPage.metaTypes)
    }
}
</script>

<style>
.sidebar-panel-wrapper h1{
  font-size: 30px;
  font-weight: 900;
  margin-top: 6px;
  margin-left: 10px;
}

.wrapper{
  overflow: scroll;
  height: calc(100vh - 69px);
}
</style>
