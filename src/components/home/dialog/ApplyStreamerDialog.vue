<template>
  <base-dialog width="500px" v-model:show="dialogVisible" :title="t('dialog.applyStreamer.title')">
    <div class="apply-streamer-content">
      <div class="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
        <i-mdi-information class="mt-0.5 shrink-0 text-xl text-blue-500" />
        <div class="text-xs text-[--user-text-color]">
          <p class="mb-1 font-bold text-[--text-color]">{{ t("dialog.applyStreamer.applyDesc") }}</p>
          <p>{{ t("dialog.applyStreamer.applyDescInfo") }}</p>
        </div>
      </div>
      <n-form
        ref="formRef"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
        :model="formValue"
        :rules="rules">
        <n-form-item path="realName" :label="t('dialog.applyStreamer.realName')">
          <n-input
            class="border-(1px solid #90909080)"
            v-model:value="formValue.realName"
            :placeholder="t('dialog.applyStreamer.realNamePlaceholder')" />
        </n-form-item>

        <n-form-item path="idCard" :label="t('dialog.applyStreamer.idCard')">
          <n-input
            maxlength="18"
            class="border-(1px solid #90909080)"
            v-model:value="formValue.idCard"
            :placeholder="t('dialog.applyStreamer.idCardPlaceholder')" />
        </n-form-item>

        <n-form-item path="phone" :label="t('dialog.applyStreamer.phone')">
          <n-input
            class="border-(1px solid #90909080)"
            v-model:value="formValue.phone"
            :placeholder="t('dialog.applyStreamer.phonePlaceholder')" />
        </n-form-item>

        <n-form-item path="category" :label="t('dialog.applyStreamer.liveCategory')">
          <n-select
            v-model:value="formValue.category"
            :options="categoryOptions"
            :placeholder="t('dialog.applyStreamer.liveCategoryPlaceholder')">
            <template #empty>
              <n-empty :description="t('dialog.applyStreamer.noCategory')" />
            </template>
          </n-select>
        </n-form-item>

        <n-form-item path="reason" :label="t('dialog.applyStreamer.reason')">
          <n-input
            type="textarea"
            maxlength="100"
            show-count
            class="border-(1px solid #90909080)"
            v-model:value="formValue.reason"
            :placeholder="t('dialog.applyStreamer.reasonPlaceholder')"
            :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>

      <div class="mb-6 flex-center">
        <n-checkbox v-model:checked="isAgreed">
          <span class="text-xs text-[--user-text-color]">
            {{ t("dialog.applyStreamer.agree") }}
            <span class="cursor-pointer text-blue-500">{{ t("dialog.applyStreamer.agreeLink") }}</span>
          </span>
        </n-checkbox>
      </div>

      <div class="flex justify-end gap-3">
        <n-button @click="closeDialog">{{ t("components.common.cancel") }}</n-button>
        <n-button type="primary" :loading="loading" :disabled="!isAgreed" @click="handleSubmit">
          {{ t("dialog.applyStreamer.submit") }}
        </n-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FormInst } from "naive-ui";

import { applyAnchorApi } from "@/api/user";
import { getChildCategoryApi } from "@/api/live";
import type { ChildCategoryItem } from "@/api/types";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
}>();
const emit = defineEmits<{
  "update:show": [value: boolean];
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

// 模拟子分区选项
const categoryOptions = ref<ChildCategoryItem[]>([]);
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
  const categoryId = categoryOptions.value.find((item) => item.value === formValue.category)?.id;
  console.log(categoryId);
  try {
    await applyAnchorApi({
      realName: formValue.realName,
      idCard: formValue.idCard,
      phone: formValue.phone,
      categoryId: categoryId || 0,
      reason: formValue.reason
    });
  } catch (error) {
    window.$message.error(t("dialog.applyStreamer.msg.applyError"));
  } finally {
    loading.value = false;
  }
  window.$message.success(t("dialog.applyStreamer.msg.applySuccess"));
  closeDialog();
  // 重置表单
  formValue.realName = "";
  formValue.idCard = "";
  formValue.phone = "";
  formValue.category = null;
  formValue.reason = "";
  isAgreed.value = false;
};

onMounted(async () => {
  categoryOptions.value = await getChildCategoryApi();
});
</script>

<style scoped></style>
