<template>
  <mobile-layout>
    <mobile-scaffold :safe-area="false">
      <template #container>
        <router-view v-slot="{ Component }">
          <transition name="slide" appear mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </template>
      <template #footer>
        <div>
          <tab-bar />
        </div>
      </template>
    </mobile-scaffold>
  </mobile-layout>
</template>

<script setup lang="ts">
import TabBar from "#/layout/tabBar/index.vue";

const route = useRoute();
</script>
