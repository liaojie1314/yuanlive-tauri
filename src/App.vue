<template>
  <naive-provider :message-max="3" :notify-max="3">
    <Home />
  </naive-provider>
</template>

<script setup lang="ts">
import Home from "@/views/page/Home.vue";
</script>
