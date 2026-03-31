<template>
  <n-modal
    preset="card"
    class="w-[650px] max-w-[95vw]"
    :show="show"
    :title="mode === 'add' ? t('dialog.agentEdit.add') : t('dialog.agentEdit.edit')"
    :bordered="false"
    :segmented="{ content: 'soft', footer: 'soft' }"
    @update:show="(val) => $emit('update:show', val)">
    <n-scrollbar style="max-height: 65vh" class="pr-4">
      <n-form
        ref="formRef"
        label-placement="left"
        label-width="100"
        require-mark-placement="right-hanging"
        class="mt-2"
        :model="formData"
        :rules="rules">
        <n-form-item path="name" :label="t('dialog.agentEdit.name')">
          <n-input
            class="border-(1px solid #90909080)"
            v-model:value="formData.name"
            :placeholder="t('dialog.agentEdit.namePlaceholder')" />
        </n-form-item>

        <n-form-item path="avatar" :label="t('dialog.agentEdit.avatar')">
          <n-flex align="center" :size="16">
            <n-avatar
              round
              fallback-src="https://picsum.photos/id/1010/100/100"
              class="border border-[--line-color] shadow-sm"
              :size="54"
              :src="formData.avatar" />
            <n-flex vertical justify="center" :size="6">
              <n-flex :size="8">
                <n-button size="small" secondary type="primary">
                  <template #icon><i-mdi-upload /></template>
                  {{ t("dialog.agentEdit.uploadImage") }}
                </n-button>
                <n-button size="small" secondary @click="randomAvatar">
                  <template #icon><i-mdi-dice-multiple-outline /></template>
                  {{ t("dialog.agentEdit.randomAvatar") }}
                </n-button>
              </n-flex>
              <span class="text-11px text-[#909090]">{{ t("dialog.agentEdit.avatarDesc") }}</span>
            </n-flex>
          </n-flex>
        </n-form-item>

        <n-form-item path="category" :label="t('dialog.agentEdit.type')">
          <n-select
            filterable
            tag
            v-model:value="formData.category"
            :placeholder="t('dialog.agentEdit.typePlaceholder')"
            :options="categoryOptions" />
        </n-form-item>

        <n-form-item path="modelId" :label="t('dialog.agentEdit.bindModel')">
          <n-select
            clearable
            v-model:value="formData.modelId"
            :placeholder="t('dialog.agentEdit.bindModelPlaceholder')"
            :options="modelOptions" />
        </n-form-item>

        <n-grid :cols="2" :x-gap="24">
          <n-form-item-gi path="sort" :label="t('dialog.agentEdit.sortValue')">
            <n-input-number class="w-full" v-model:value="formData.sort" />
          </n-form-item-gi>
          <n-form-item-gi path="status" :label="t('dialog.agentEdit.status')">
            <n-select v-model:value="formData.status" :options="statusOptions" />
          </n-form-item-gi>
        </n-grid>

        <n-form-item path="isPublic" :label="t('dialog.agentEdit.isPublic')">
          <div class="flex items-center gap-3">
            <n-switch v-model:value="formData.isPublic" />
            <span class="text-sm text-[--user-text-color]">
              {{ formData.isPublic ? t("dialog.agentEdit.public") : t("dialog.agentEdit.private") }}
            </span>
          </div>
        </n-form-item>

        <n-form-item path="description" :label="t('dialog.agentEdit.desc')">
          <n-input
            type="textarea"
            class="border-(1px solid #90909080)"
            v-model:value="formData.description"
            :placeholder="t('dialog.agentEdit.descPlaceholder')"
            :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>

        <n-form-item path="prompt" :label="t('dialog.agentEdit.setting')">
          <n-input
            type="textarea"
            class="border-(1px solid #90909080)"
            v-model:value="formData.prompt"
            :placeholder="t('dialog.agentEdit.settingPlaceholder')"
            :autosize="{ minRows: 4, maxRows: 8 }" />
        </n-form-item>
      </n-form>
    </n-scrollbar>

    <template #footer>
      <div class="flex justify-end gap-3">
        <n-button @click="$emit('update:show', false)">{{ t("components.common.cancel") }}</n-button>
        <n-button type="primary" @click="handleSubmit">
          {{ mode === "add" ? t("dialog.agentEdit.create") : t("dialog.agentEdit.save") }}
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
  initialData?: any;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "submit", data: any): void;
}>();

const categoryOptions = [
  { label: "AI助手", value: "AI助手" },
  { label: "创意设计", value: "创意设计" },
  { label: "编程开发", value: "编程开发" },
  { label: "角色扮演", value: "角色扮演" }
];
const modelOptions = [
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5" },
  { label: "DeepSeek V3", value: "deepseek-v3" }
];
const defaultData = {
  id: "",
  name: "",
  avatar: "",
  category: null,
  modelId: null,
  sort: 0,
  status: "available",
  isPublic: false,
  description: "",
  prompt: ""
};

const formRef = ref<FormInst | null>(null);
const formData = ref({ ...defaultData });

const statusOptions = computed(() => [
  { label: t("dialog.addModal.available"), value: "available" },
  { label: t("dialog.addModal.disabled"), value: "disabled" }
]);

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t("dialog.agentEdit.rules.name"), trigger: "blur" }],
  category: [{ required: true, message: t("dialog.agentEdit.rules.type"), trigger: "blur" }],
  prompt: [{ required: true, message: t("dialog.agentEdit.rules.prompt"), trigger: "blur" }]
}));

/** 随机生成头像 */
const randomAvatar = () => {
  formData.value.avatar = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/100/100`;
};

/**
 * 提交表单数据
 * @param e 点击事件
 */
const handleSubmit = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      const submitData = {
        ...formData.value,
        isPublic: formData.value.isPublic
      };
      emit("submit", submitData);
    } else {
      window.$message?.error(t("dialog.addModal.msg.completeInfo"));
    }
  });
};

// 监听弹窗打开，回填或重置数据
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.mode === "edit" && props.initialData) {
        formData.value = { ...props.initialData };
      } else {
        formData.value = {
          ...defaultData,
          avatar: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/100/100`
        };
      }
    }
  }
);
</script>
