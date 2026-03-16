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
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-[--text-color]">
            {{ t("components.addToKnowledge.chooseKnowledge") }}
          </span>
          <span class="text-xs text-blue-500 cursor-pointer hover:underline transition-all" @click="toggleCreateMode">
            {{ isCreatingNew ? t("components.common.cancel") : "+ " + t("components.addToKnowledge.newKnowledge") }}
          </span>
        </div>

        <n-select
          v-if="!isCreatingNew"
          v-model:value="selectedKbId"
          :options="knowledgeBases"
          :placeholder="t('components.addToKnowledge.selectKnowledgePlaceholder')"
          size="small" />

        <n-input
          v-else
          v-model:value="newKbName"
          :placeholder="t('components.addToKnowledge.newKnowledgePlaceholder')"
          size="small"
          class="border-(1px solid #90909080)"
          @keyup.enter="handleSubmit" />
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
const isCreatingNew = ref(false);
const newKbName = ref("");

// 模拟知识库列表
const knowledgeBases = ref([
  { label: "前端架构设计规范", value: "kb_1" },
  { label: "Rust 学习笔记", value: "kb_2" },
  { label: "个人日程与计划", value: "kb_3" }
]);

/** 切换新建知识库模式 */
const toggleCreateMode = () => {
  isCreatingNew.value = !isCreatingNew.value;
  if (!isCreatingNew.value) {
    newKbName.value = ""; // 取消新建时清空输入
  }
};

/** 处理添加到知识库的提交 */
const handleSubmit = async () => {
  // 如果处于新建模式，先执行新建逻辑
  if (isCreatingNew.value) {
    const trimmedName = newKbName.value.trim();
    if (!trimmedName) {
      window.$message?.warning(t("components.addToKnowledge.msg.emptyKnowledgeName"));
      return;
    }
    // TODO: 这里可以调用后端 API 真实创建知识库
    // 模拟新建成功，生成一个临时 ID 并选中它
    const newId = `kb_${Date.now()}`;
    knowledgeBases.value.push({ label: trimmedName, value: newId });
    selectedKbId.value = newId;
    isCreatingNew.value = false;
  }

  // 校验是否有选中的知识库
  if (!selectedKbId.value) return;

  isSubmitting.value = true;
  try {
    // 模拟网络请求或 Tauri 本地调用，将文件加入知识库
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
      // 每次打开弹窗重置所有状态
      selectedKbId.value = null;
      isCreatingNew.value = false;
      newKbName.value = "";
    }
  }
);
</script>
