<template>
  <div
    class="audio-block my-2 flex max-w-[350px] min-w-[280px] items-center gap-2.5 rounded-full border border-[--line-color] bg-[--input-area-bg] p-2 shadow-sm select-none">
    <div class="ml-1 flex flex-shrink-0 items-center gap-1.5">
      <div
        class="flex h-6 w-6 cursor-pointer items-center justify-center text-[--user-text-color] opacity-60 transition-colors hover:text-[--message-render-color] hover:opacity-100"
        :title="$t('components.audioBlock.back')"
        @click="skip(-5)">
        <i-material-symbols-fast-rewind-rounded class="text-[18px]" />
      </div>

      <div
        class="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-[--message-render-color] text-white shadow-sm transition-transform active:scale-95"
        @click="togglePlay">
        <i-material-symbols-pause-rounded v-if="isPlaying" class="text-lg" />
        <i-material-symbols-play-arrow-rounded v-else class="ml-0.5 text-lg" />
      </div>

      <div
        class="flex h-6 w-6 cursor-pointer items-center justify-center text-[--user-text-color] opacity-60 transition-colors hover:text-[--message-render-color] hover:opacity-100"
        :title="$t('components.audioBlock.forward')"
        @click="skip(5)">
        <i-material-symbols-fast-forward-rounded class="text-[18px]" />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-1 pr-3">
      <div
        ref="progressBarRef"
        class="relative h-[5px] cursor-pointer rounded-full bg-[--line-color] transition-all hover:h-[6px]"
        @click="seekAudio">
        <div
          class="pointer-events-none absolute top-0 bottom-0 left-0 rounded-full bg-[--message-render-color]"
          :style="{ width: progress + '%' }">
          <div
            class="absolute top-1/2 right-0 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border border-[--message-render-color] bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
        </div>
      </div>

      <div class="mt-0.5 flex justify-between font-mono text-[10px] text-[--user-text-color] opacity-80">
        <span>{{ formatSecondsToTimeStr(currentTime) }}</span>
        <span>{{ formatSecondsToTimeStr(duration) }}</span>
      </div>
    </div>

    <audio
      ref="audioRef"
      :src="url"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"></audio>
  </div>
</template>

<script setup lang="ts">
import { formatSecondsToTimeStr } from "@/utils/FormattingUtils";

defineOptions({
  name: "AudioBlock"
});

defineProps<{
  url: string;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
const progressBarRef = ref<HTMLElement | null>(null);

const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);

/** 播放/暂停控制 */
const togglePlay = () => {
  if (!audioRef.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

/**
 * 快进/快退逻辑 (单位：秒)
 * @param seconds 快进/快退的秒数
 */
const skip = (seconds: number) => {
  if (!audioRef.value || duration.value === 0) return;

  let newTime = currentTime.value + seconds;

  // 边界处理限制
  if (newTime < 0) newTime = 0;
  if (newTime > duration.value) newTime = duration.value;

  audioRef.value.currentTime = newTime;
  currentTime.value = newTime;
  progress.value = (newTime / duration.value) * 100;

  // 如果快进到了结尾，自动触发结束状态
  if (newTime === duration.value && isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

/** 元数据加载完毕（获取总时长） */
const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
};

/** 进度更新 */
const onTimeUpdate = () => {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  if (duration.value > 0) {
    progress.value = (currentTime.value / duration.value) * 100;
  }
};

/** 播放结束 */
const onEnded = () => {
  isPlaying.value = false;
  progress.value = 100; // 确保进度条走到底

  // 延迟一小会儿重置状态，体验更好
  setTimeout(() => {
    if (!isPlaying.value) {
      progress.value = 0;
      currentTime.value = 0;
    }
  }, 500);
};

/** 点击进度条跳转 */
const seekAudio = (e: MouseEvent) => {
  if (!progressBarRef.value || !audioRef.value || duration.value === 0) return;
  const rect = progressBarRef.value.getBoundingClientRect();
  const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percent = clickX / rect.width;

  audioRef.value.currentTime = percent * duration.value;
  progress.value = percent * 100;
};
</script>

<style scoped>
/* 防止在拖拽进度条时选中文本 */
.audio-block {
  -webkit-user-select: none;
  user-select: none;
}
</style>
