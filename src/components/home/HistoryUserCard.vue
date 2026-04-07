<template>
  <div
    class="flex cursor-pointer items-center gap-3 rounded-xl bg-[--tray-bg-color] p-3 transition-colors hover:bg-[--tray-hover]">
    <n-avatar round class="shrink-0 border border-[--line-color]" :size="48" :src="user.avatar" />

    <div class="flex min-w-0 flex-1 flex-col justify-center">
      <div class="flex items-center gap-1">
        <span class="truncate text-sm font-bold text-[--text-color]">{{ user.name }}</span>
        <i-mdi-check-decagram v-if="user.verified" class="shrink-0 text-xs text-blue-400" />
      </div>

      <div class="mt-0.5 truncate text-[11px] text-[--user-text-color]">
        {{ user.desc }}
      </div>

      <div v-if="user.unseenCount > 0" class="mt-1.5 flex">
        <span class="rounded bg-[--bg-setting-item] px-1.5 py-0.5 text-[10px] text-[--user-text-color]">
          {{ $t("components.historyCard.unwatchedVideos", { count: user.unseenCount }) }}
        </span>
      </div>
    </div>

    <n-button
      size="small"
      round
      class="w-[68px] shrink-0 border-none px-0 font-medium transition-all"
      :class="
        user.isFollowed
          ? 'bg-[--bg-setting-item] text-[--user-text-color]'
          : 'bg-[#ff0050] text-white hover:bg-[#ff3366]'
      "
      @click.stop="$emit('toggle-follow', user)">
      {{ user.isFollowed ? $t("components.historyCard.followed") : $t("components.historyCard.follow") }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: any;
}>();

defineEmits(["toggle-follow"]);
</script>
