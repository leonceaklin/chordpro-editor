<template>
    <div class="sidebar-panel-wrapper">
      <format :style="this.$parent.sidebarPanel  != 'format' ? 'display: none' : ''"></format>
      <dictionary :style="this.$parent.sidebarPanel  != 'dictionary' ? 'display: none' : ''"></dictionary>
      <metadata :style="this.$parent.sidebarPanel  != 'meta' ? 'display: none' : ''"></metadata>
    </div>
</template>

<script>
import { messageBus } from '../main.js';

import Format from '../components/Format.vue';
import Dictionary from '../components/Dictionary.vue';
import Metadata from '../components/Metadata.vue';

export default {
    data: function(){
      return {
      }
    },
    components: {
      format: Format,
      dictionary: Dictionary,
      metadata: Metadata,
    },
    methods: {

    },
    mounted: function() {

    }
}
</script>
