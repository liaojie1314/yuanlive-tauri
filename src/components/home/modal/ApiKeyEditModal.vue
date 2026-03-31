<template>
  <n-modal
    preset="card"
    class="w-[500px] max-w-[95vw]"
    :show="show"
    :title="mode === 'add' ? t('dialog.apiKeyEdit.add') : t('dialog.apiKeyEdit.edit')"
    :bordered="false"
    :segmented="{ content: 'soft', footer: 'soft' }"
    @update:show="(val) => $emit('update:show', val)">
    <n-form
      ref="formRef"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
      class="mt-2"
      :model="formData"
      :rules="rules">
      <n-form-item path="name" :label="t('dialog.apiKeyEdit.name')">
        <n-input
          class="border-(1px solid #90909080)"
          v-model:value="formData.name"
          :placeholder="t('dialog.apiKeyEdit.namePlaceholder')" />
      </n-form-item>

      <n-form-item path="key" :label="t('dialog.apiKeyEdit.key')">
        <n-input
          type="password"
          show-password-on="click"
          class="border-(1px solid #90909080)"
          v-model:value="formData.key"
          :placeholder="t('dialog.apiKeyEdit.keyPlaceholder')" />
      </n-form-item>

      <n-form-item path="platform" :label="t('dialog.apiKeyEdit.platform')">
        <n-select
          v-model:value="formData.platform"
          :placeholder="t('dialog.apiKeyEdit.platformPlaceholder')"
          :options="platformOptions" />
      </n-form-item>

      <n-form-item path="baseUrl" :label="t('dialog.apiKeyEdit.baseUrl')">
        <n-input
          class="border-(1px solid #90909080)"
          v-model:value="formData.baseUrl"
          :placeholder="t('dialog.apiKeyEdit.baseUrlPlaceholder')" />
      </n-form-item>

      <n-form-item path="status" :label="t('dialog.apiKeyEdit.status')">
        <n-select v-model:value="formData.status" :options="statusOptions" />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <n-button @click="$emit('update:show', false)">{{ t("components.common.cancel") }}</n-button>
        <n-button type="primary" @click="handleSubmit">
          {{ mode === "add" ? t("dialog.addModal.create") : t("dialog.apiKeyEdit.save") }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FormInst, FormRules } from "naive-ui";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
  mode: "add" | "edit";
  initialData?: any; // 编辑时传入的初始数据
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "submit", data: any): void;
}>();

const platformOptions = [
  { label: "OpenAI", value: "OpenAI" },
  { label: "Moonshot (月之暗面)", value: "Moonshot" },
  { label: "SiliconFlow", value: "SiliconFlow" }
];

const formRef = ref<FormInst | null>(null);
// 表单数据
const formData = ref({
  id: "",
  name: "",
  key: "",
  platform: null,
  baseUrl: "",
  status: "available"
});

const statusOptions = computed(() => [
  { label: t("dialog.addModal.available"), value: "available" },
  { label: t("dialog.addModal.disabled"), value: "disabled" }
]);

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t("dialog.apiKeyEdit.rules.name"), trigger: "blur" }],
  key: [{ required: true, message: t("dialog.apiKeyEdit.rules.key"), trigger: "blur" }],
  platform: [{ required: true, message: t("dialog.apiKeyEdit.rules.platform"), trigger: "change" }]
}));

/**
 * 提交表单
 * @param e 点击事件
 * */
const handleSubmit = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      emit("submit", { ...formData.value });
    } else {
      window.$message?.error(t("dialog.addModal.msg.completeInfo"));
    }
  });
};

// 监听弹窗打开，如果是编辑模式则回填数据，如果是新增则重置
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.mode === "edit" && props.initialData) {
        formData.value = { ...props.initialData };
      } else {
        formData.value = { id: "", name: "", key: "", platform: null, baseUrl: "", status: "available" };
      }
    }
  }
);
</script>
