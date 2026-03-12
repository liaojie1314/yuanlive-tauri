<template>
  <n-modal
    :show="show"
    preset="card"
    :title="t('components.addToKnowledge.title')"
    class="w-[400px]"
    :bordered="false"
    size="small"
    @update:show="$emit('update:show', $event)">
    <div class="flex flex-col gap-4">
      <div class="text-sm text-[--user-text-color]">
        {{ t("components.addToKnowledge.addTo") }}
        <span class="font-bold text-blue-500">{{ file?.name }}</span>
        {{ t("components.addToKnowledge.addToKnowledgeDesc") }}
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs font-bold text-[--text-color]">{{ t("components.addToKnowledge.chooseKnowledge") }}</span>
        <n-select
          v-model:value="selectedKbId"
          :options="knowledgeBases"
          :placeholder="t('components.addToKnowledge.selectKnowledgePlaceholder')"
          size="small" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <n-button size="small" @click="$emit('update:show', false)">{{ t("components.common.cancel") }}</n-button>
        <n-button size="small" type="primary" :disabled="!selectedKbId" :loading="isSubmitting" @click="handleSubmit">
          {{ t("components.addToKnowledge.confirm") }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
  file: any;
}>();

const emit = defineEmits(["update:show", "success"]);

const selectedKbId = ref<string | null>(null);
const isSubmitting = ref(false);

// 模拟知识库列表
const knowledgeBases = ref([
  { label: "前端架构设计规范", value: "kb_1" },
  { label: "Rust 学习笔记", value: "kb_2" },
  { label: "个人日程与计划", value: "kb_3" }
]);

/** 处理添加到知识库的提交 */
const handleSubmit = async () => {
  if (!selectedKbId.value) return;

  isSubmitting.value = true;
  try {
    // 模拟网络请求或 Tauri 本地调用
    console.log(`将文件 ${props.file.name} 添加到知识库 ${selectedKbId.value}`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    window.$message?.success(t("components.addToKnowledge.msg.success"));
    emit("success");
    emit("update:show", false);
  } catch (error) {
    window.$message?.error(t("components.addToKnowledge.msg.error"));
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      selectedKbId.value = null; // 每次打开弹窗重置选择
    }
  }
);
</script>
