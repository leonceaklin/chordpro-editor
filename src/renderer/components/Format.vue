<template>
<div>
<h1>{{ i18n.__('Format') }}</h1>
</div>
</template>

<script>
import { messageBus, i18n } from '../main.js';

export default {
    data: function(){
      return {
        i18n: i18n
      }
    },
    methods: {

    },
    mounted: function() {

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
</style>
