<template>
  <base-dialog v-model:show="dialogVisible" :title="t('dialog.applyStreamer.title')" width="500px">
    <div class="apply-streamer-content">
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6 flex items-start gap-3">
        <i-mdi-information class="text-blue-500 text-xl shrink-0 mt-0.5" />
        <div class="text-xs text-[--user-text-color]">
          <p class="font-bold text-[--text-color] mb-1">{{ t("dialog.applyStreamer.applyDesc") }}</p>
          <p>{{ t("dialog.applyStreamer.applyDescInfo") }}</p>
        </div>
      </div>
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging">
        <n-form-item :label="t('dialog.applyStreamer.realName')" path="realName">
          <n-input
            v-model:value="formValue.realName"
            class="border-(1px solid #90909080)"
            :placeholder="t('dialog.applyStreamer.realNamePlaceholder')" />
        </n-form-item>

        <n-form-item :label="t('dialog.applyStreamer.idCard')" path="idCard">
          <n-input
            v-model:value="formValue.idCard"
            class="border-(1px solid #90909080)"
            :placeholder="t('dialog.applyStreamer.idCardPlaceholder')"
            maxlength="18" />
        </n-form-item>

        <n-form-item :label="t('dialog.applyStreamer.phone')" path="phone">
          <n-input
            v-model:value="formValue.phone"
            class="border-(1px solid #90909080)"
            :placeholder="t('dialog.applyStreamer.phonePlaceholder')" />
        </n-form-item>

        <n-form-item :label="t('dialog.applyStreamer.liveCategory')" path="category">
          <n-select
            v-model:value="formValue.category"
            :options="categoryOptions"
            :placeholder="t('dialog.applyStreamer.liveCategoryPlaceholder')" />
        </n-form-item>

        <n-form-item :label="t('dialog.applyStreamer.reason')" path="reason">
          <n-input
            v-model:value="formValue.reason"
            type="textarea"
            :placeholder="t('dialog.applyStreamer.reasonPlaceholder')"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="100"
            show-count
            class="border-(1px solid #90909080)" />
        </n-form-item>
      </n-form>

      <div class="flex items-center justify-center mb-6">
        <n-checkbox v-model:checked="isAgreed">
          <span class="text-xs text-[--user-text-color]">
            {{ t("dialog.applyStreamer.agree") }}
            <span class="text-blue-500 cursor-pointer">{{ t("dialog.applyStreamer.agreeLink") }}</span>
          </span>
        </n-checkbox>
      </div>

      <div class="flex justify-end gap-3">
        <n-button @click="closeDialog">{{ t("components.common.cancel") }}</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit" :disabled="!isAgreed">
          {{ t("dialog.applyStreamer.submit") }}
        </n-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FormInst } from "naive-ui";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
}>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [data: any];
}>();

// 验证规则
const rules = {
  realName: [{ required: true, message: "", trigger: "blur" }],
  idCard: [
    { required: true, message: t("dialog.applyStreamer.rule.idCard"), trigger: "blur" },
    { min: 18, max: 18, message: t("dialog.applyStreamer.rule.idCardLengthError"), trigger: "blur" }
  ],
  phone: [
    { required: true, message: t("dialog.applyStreamer.rule.phone"), trigger: "blur" },
    { min: 11, max: 11, message: t("dialog.applyStreamer.rule.phoneLengthError"), trigger: "blur" }
  ],
  category: [{ required: true, message: t("dialog.applyStreamer.rule.liveCategory"), trigger: ["blur", "change"] }]
};

// TODO: 模拟分区选项
const categoryOptions = [
  { label: "单机游戏", value: "game" },
  { label: "生活娱乐", value: "life" },
  { label: "知识分享", value: "knowledge" },
  { label: "虚拟主播", value: "virtual" },
  { label: "其他", value: "other" }
];

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const isAgreed = ref(false);
// 表单数据
const formValue = reactive({
  realName: "",
  idCard: "",
  phone: "",
  category: null,
  reason: ""
});
// 双向绑定 Dialog 显示状态
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/** 关闭弹窗 */
const closeDialog = () => {
  dialogVisible.value = false;
};

/**
 * 提交申请
 * @param e 事件对象
 */
const handleSubmit = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      submitData();
    } else {
      window.$message.error(t("dialog.applyStreamer.msg.completeInfo"));
    }
  });
};

/** 提交申请数据 */
const submitData = async () => {
  loading.value = true;
  // 模拟 API 请求
  setTimeout(() => {
    loading.value = false;
    window.$message.success(t("dialog.applyStreamer.msg.applySuccess"));
    emit("submit", { ...formValue });
    closeDialog();
    // 重置表单
    formValue.realName = "";
    formValue.idCard = "";
    formValue.phone = "";
    formValue.category = null;
    formValue.reason = "";
    isAgreed.value = false;
  }, 1500);
};
</script>

<style scoped></style>
