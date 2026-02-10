<template>
  <base-dialog v-model:show="dialogVisible" title="申请成为主播" width="500px">
    <div class="apply-streamer-content">
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6 flex items-start gap-3">
        <i-mdi-information class="text-blue-500 text-xl shrink-0 mt-0.5" />
        <div class="text-xs text-[--user-text-color]">
          <p class="font-bold text-[--text-color] mb-1">申请说明</p>
          <p>请如实填写身份信息，审核通过后即可开启直播功能。我们承诺严格保障您的信息安全。</p>
        </div>
      </div>
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="left"
        label-width="80"
        require-mark-placement="right-hanging">
        <n-form-item label="真实姓名" path="realName">
          <n-input
            v-model:value="formValue.realName"
            class="border-(1px solid #90909080)"
            placeholder="请填写身份证上的姓名" />
        </n-form-item>

        <n-form-item label="身份证号" path="idCard">
          <n-input
            v-model:value="formValue.idCard"
            class="border-(1px solid #90909080)"
            placeholder="请填写18位身份证号"
            maxlength="18" />
        </n-form-item>

        <n-form-item label="手机号码" path="phone">
          <n-input
            v-model:value="formValue.phone"
            class="border-(1px solid #90909080)"
            placeholder="用于接收审核通知" />
        </n-form-item>

        <n-form-item label="直播分区" path="category">
          <n-select
            v-model:value="formValue.category"
            :options="categoryOptions"
            placeholder="请选择您擅长的直播领域" />
        </n-form-item>

        <n-form-item label="申请理由" path="reason">
          <n-input
            v-model:value="formValue.reason"
            type="textarea"
            placeholder="简单介绍一下您的直播计划..."
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="100"
            show-count
            class="border-(1px solid #90909080)" />
        </n-form-item>
      </n-form>

      <div class="flex items-center justify-center mb-6">
        <n-checkbox v-model:checked="isAgreed">
          <span class="text-xs text-[--user-text-color]">
            我已阅读并同意
            <span class="text-blue-500 cursor-pointer">《YuanLive主播注册协议》</span>
          </span>
        </n-checkbox>
      </div>

      <div class="flex justify-end gap-3">
        <n-button @click="closeDialog">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit" :disabled="!isAgreed">提交申请</n-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import type { FormInst } from "naive-ui";

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [data: any];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const isAgreed = ref(false);

// 双向绑定 Dialog 显示状态
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

// 表单数据
const formValue = reactive({
  realName: "",
  idCard: "",
  phone: "",
  category: null,
  reason: ""
});

// 验证规则
const rules = {
  realName: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  idCard: [
    { required: true, message: "请输入身份证号", trigger: "blur" },
    { min: 18, max: 18, message: "身份证号长度不正确", trigger: "blur" }
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { min: 11, max: 11, message: "手机号长度不正确", trigger: "blur" }
  ],
  category: [{ required: true, message: "请选择直播分区", trigger: ["blur", "change"] }]
};

// 分区选项
const categoryOptions = [
  { label: "单机游戏", value: "game" },
  { label: "生活娱乐", value: "life" },
  { label: "知识分享", value: "knowledge" },
  { label: "虚拟主播", value: "virtual" },
  { label: "其他", value: "other" }
];

const closeDialog = () => {
  dialogVisible.value = false;
};

const handleSubmit = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      submitData();
    } else {
      message.error("请完善申请信息");
    }
  });
};

const submitData = async () => {
  loading.value = true;
  // 模拟 API 请求
  setTimeout(() => {
    loading.value = false;
    message.success("申请已提交，请耐心等待审核");
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
