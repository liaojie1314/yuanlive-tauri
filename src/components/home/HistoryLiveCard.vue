<template>
  <div
    class="flex cursor-pointer items-center gap-3 rounded-xl bg-[--tray-bg-color] p-3 transition-colors hover:bg-[--tray-hover]">
    <div class="relative shrink-0">
      <n-avatar
        round
        class="border border-[--line-color]"
        :size="48"
        :src="live.avatar"
        :class="{ 'border-[#ff0050] border-2 p-0.5': live.isLiveNow }" />
      <div
        v-if="live.isLiveNow"
        class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#ff0050] px-1 py-0.5 text-[8px] font-bold text-white scale-90 border border-white dark:border-gray-800">
        {{ $t("components.historyCard.live") }}
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center">
      <div class="flex items-center gap-1">
        <span class="truncate text-sm font-bold text-[--text-color]">{{ live.name }}</span>
        <i-mdi-check-decagram v-if="live.verified" class="shrink-0 text-xs text-orange-400" />
      </div>

      <div class="mt-0.5 truncate text-[11px] text-[--user-text-color]">
        {{ live.desc }}
      </div>

      <div class="mt-1 truncate text-[11px] text-[--disabled-color]">
        {{ live.statusText }}
      </div>
    </div>

    <n-button
      size="small"
      round
      class="w-[68px] shrink-0 border-none px-0 font-medium transition-all"
      :class="
        live.isFollowed
          ? 'bg-[--bg-setting-item] text-[--user-text-color]'
          : 'bg-[#ff0050] text-white hover:bg-[#ff3366]'
      "
      @click.stop="$emit('toggle-follow', live)">
      {{ live.isFollowed ? $t("components.historyCard.followed") : $t("components.historyCard.follow") }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  live: any;
}>();

defineEmits(["toggle-follow"]);
</script>
