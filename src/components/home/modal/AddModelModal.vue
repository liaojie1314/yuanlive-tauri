<template>
  <n-modal
    preset="card"
    size="large"
    class="w-[600px] max-w-[95vw]"
    :title="t('dialog.addModal.title')"
    :show="show"
    :bordered="false"
    :segmented="{ content: 'soft', footer: 'soft' }"
    @update:show="(val) => $emit('update:show', val)">
    <n-scrollbar style="max-height: 65vh" class="pr-4">
      <n-form
        ref="formRef"
        label-placement="left"
        label-width="110"
        require-mark-placement="right-hanging"
        class="mt-2"
        :model="formData"
        :rules="rules">
        <n-form-item path="apiKeyId" :label="t('dialog.addModal.apiKey')">
          <n-input-group>
            <n-select
              v-model:value="formData.apiKeyId"
              :placeholder="t('dialog.addModal.apiKeyPlaceholder')"
              :options="apiKeyOptions" />
            <n-button type="primary" secondary class="px-4" @click="showKeyManageModal = true">
              <template #icon><i-mdi-cog-outline class="text-lg" /></template>
              {{ t("dialog.addModal.manage") }}
            </n-button>
          </n-input-group>
        </n-form-item>

        <n-form-item path="platform" :label="t('dialog.addModal.platform')">
          <n-input disabled v-model:value="formData.platform" :placeholder="t('dialog.addModal.platformPlaceholder')" />
        </n-form-item>

        <n-form-item path="type" :label="t('dialog.addModal.type')">
          <n-radio-group v-model:value="formData.type">
            <n-space wrap :size="[16, 12]">
              <n-radio value="chat">
                <div class="flex items-center gap-1.5">
                  <i-mdi-message-text-outline class="text-base" />
                  {{ t("setting.ai.type.chat") }}
                </div>
              </n-radio>
              <n-radio value="image">
                <div class="flex items-center gap-1.5">
                  <i-mdi-image-outline class="text-base" />
                  {{ t("setting.ai.type.image") }}
                </div>
              </n-radio>
              <n-radio value="audio">
                <div class="flex items-center gap-1.5">
                  <i-mdi-microphone-outline class="text-base" />
                  {{ t("setting.ai.type.audio") }}
                </div>
              </n-radio>
              <n-radio value="text2video">
                <div class="flex items-center gap-1.5">
                  <i-mdi-video-outline class="text-base" />
                  {{ t("setting.ai.type.text2video") }}
                </div>
              </n-radio>
              <n-radio value="image2video">
                <div class="flex items-center gap-1.5">
                  <i-mdi-animation-play-outline class="text-base" />
                  {{ t("setting.ai.type.image2video") }}
                </div>
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item path="name" :label="t('dialog.addModal.name')">
          <n-input
            class="border-(1px solid #90909080)"
            v-model:value="formData.name"
            :placeholder="t('dialog.addModal.namePlaceholder')" />
        </n-form-item>

        <n-form-item path="identifier" :label="t('dialog.addModal.identifier')">
          <n-input
            class="border-(1px solid #90909080)"
            v-model:value="formData.identifier"
            :placeholder="t('dialog.addModal.identifierPlaceholder')" />
        </n-form-item>

        <n-form-item path="status" :label="t('dialog.addModal.status')">
          <n-select v-model:value="formData.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item path="sortValue" :label="t('dialog.addModal.sortValue')">
          <n-input-number class="w-full" v-model:value="formData.sort" />
        </n-form-item>

        <n-form-item path="temperature" :label="t('dialog.addModal.temperature')">
          <n-input-number class="w-full" v-model:value="formData.temperature" :step="0.1" :min="0" :max="2" />
        </n-form-item>
        <n-form-item path="maxTokens" :label="t('dialog.addModal.maxTokens')">
          <n-input-number class="w-full" v-model:value="formData.maxTokens" :step="100" :min="1" />
        </n-form-item>

        <n-form-item path="maxContext" :label="t('dialog.addModal.maxContext')">
          <n-input-number class="w-full" v-model:value="formData.maxContext" :step="1" :min="1" />
        </n-form-item>
        <n-form-item path="isPublic" :label="t('dialog.addModal.isPublic')">
          <div class="flex items-center gap-3 w-full h-[34px]">
            <n-switch v-model:value="formData.isPublic" />
            <span class="text-sm text-[--user-text-color]">
              {{ formData.isPublic ? t("dialog.addModal.public") : t("dialog.addModal.private") }}
            </span>
          </div>
        </n-form-item>
      </n-form>
    </n-scrollbar>

    <template #footer>
      <div class="flex justify-end gap-3">
        <n-button @click="$emit('update:show', false)">{{ t("components.common.cancel") }}</n-button>
        <n-button type="primary" @click="handleSubmit">{{ t("dialog.addModal.create") }}</n-button>
      </div>
    </template>
  </n-modal>
  <api-key-manage-modal v-model:show="showKeyManageModal" />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FormInst, FormRules } from "naive-ui";

const { t } = useI18n();

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "submit", data: any): void;
}>();

const apiKeyOptions = [
  { label: "SiliconFlow 默认密钥", value: "key_1" },
  { label: "OpenAI 密钥", value: "key_2" }
];

const formRef = ref<FormInst | null>(null);
const showKeyManageModal = ref(false);

const statusOptions = computed(() => [
  { label: t("dialog.addModal.available"), value: "available" },
  { label: t("dialog.addModal.disabled"), value: "disabled" }
]);
const rules = computed<FormRules>(() => ({
  apiKeyId: [{ required: true, message: t("dialog.addModal.rules.apiKey"), trigger: ["blur", "change"] }],
  name: [{ required: true, message: t("dialog.addModal.rules.name"), trigger: ["blur", "input"] }],
  identifier: [{ required: true, message: t("dialog.addModal.rules.identifier"), trigger: ["blur", "input"] }],
  status: [{ required: true, message: t("dialog.addModal.rules.status"), trigger: ["blur", "change"] }]
}));
// 表单数据
const formData = reactive({
  apiKeyId: null,
  platform: "",
  type: "chat",
  name: "",
  identifier: "",
  status: "available",
  sort: 0,
  temperature: 0.8,
  maxTokens: 4096,
  maxContext: 10,
  isPublic: false
});

/**
 * 提交表单
 * @param e 点击事件
 */
const handleSubmit = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      emit("submit", { ...formData });
      emit("update:show", false);
    } else {
      window.$message?.error(t("dialog.addModal.msg.completeInfo"));
    }
  });
};
</script>

<style scoped>
:deep(.n-form-item .n-form-item-label) {
  font-weight: 500;
  color: var(--text-color);
}
</style>
