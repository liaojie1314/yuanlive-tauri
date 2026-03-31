<template>
  <n-modal
    preset="card"
    class="w-[700px] max-w-[95vw]"
    :show="show"
    :bordered="false"
    :segmented="{ content: 'soft' }"
    @update:show="(val) => emit('update:show', val)">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-lg font-bold">{{ t("dialog.apiKeyManage.title") }}</span>
        <n-button v-if="keyList.length > 0" size="small" type="primary" class="mr-6" @click="openAddModal">
          <template #icon><i-mdi-plus /></template>
          {{ t("dialog.apiKeyManage.add") }}
        </n-button>
      </div>
    </template>

    <div class="min-h-[300px] py-4">
      <div v-if="keyList.length === 0" class="flex flex-col items-center justify-center h-[300px] gap-4 opacity-80">
        <i-mdi-key-variant class="text-5xl text-[--user-text-color]" />
        <span class="text-[--user-text-color]">{{ t("dialog.apiKeyManage.noApiKey") }}</span>
        <n-button type="primary" @click="openAddModal">{{ t("dialog.apiKeyManage.addFirstApiKey") }}</n-button>
      </div>

      <n-flex v-else vertical :size="12">
        <div
          v-for="item in keyList"
          class="flex items-center justify-between p-4 rounded-lg border border-[--line-color] bg-[var(--bg-setting-item)] transition-all hover:border-blue-500/30"
          :key="item.id">
          <div class="flex items-center gap-4">
            <i-mdi-key-variant class="text-3xl text-[--user-text-color]" />
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="text-15px font-bold">{{ item.name }}</span>
                <n-tag
                  size="small"
                  class="!text-11px !h-20px"
                  :type="item.status === 'available' ? 'success' : 'error'"
                  :bordered="false">
                  {{ item.status === "available" ? t("dialog.addModal.available") : t("dialog.addModal.disabled") }}
                </n-tag>
                <n-tag size="small" type="warning" class="!text-11px !h-20px" :bordered="false">
                  {{ t("dialog.addModal.private") }}
                </n-tag>
              </div>
              <div class="text-12px text-[--user-text-color] opacity-80">
                {{ t("dialog.apiKeyManage.platform") }}:
                <span class="mr-3">{{ item.platform }}</span>
                {{ t("dialog.apiKeyManage.key") }}:
                <span>{{ maskApiKey(item.key) }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <n-button size="small" type="info" secondary>
              <template #icon><i-mdi-cash-multiple /></template>
              {{ t("dialog.apiKeyManage.queryBalance") }}
            </n-button>
            <n-button size="small" secondary @click="openEditModal(item)">
              <template #icon><i-mdi-pencil /></template>
              {{ t("dialog.apiKeyManage.edit") }}
            </n-button>

            <n-popconfirm
              placement="bottom-end"
              :positive-text="t('components.common.confirm')"
              :negative-text="t('components.common.cancel')"
              @positive-click="handleDelete(item.id)">
              <template #trigger>
                <n-button size="small" type="error" secondary>
                  <template #icon><i-mdi-delete /></template>
                  {{ t("dialog.apiKeyManage.delete") }}
                </n-button>
              </template>
              <div class="flex flex-col gap-1">
                <span>{{ t("dialog.apiKeyManage.confirmDelete", { key: item.name }) }}</span>
                <span class="text-red-500 text-xs">{{ t("dialog.apiKeyManage.deleteTip") }}</span>
              </div>
            </n-popconfirm>
          </div>
        </div>
      </n-flex>
    </div>

    <api-key-edit-modal
      v-model:show="showEditModal"
      :mode="formMode"
      :initial-data="currentEditData"
      @submit="handleFormSubmit" />
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{ show: boolean }>();
const emit = defineEmits<(e: "update:show", value: boolean) => void>();

const keyList = ref<any[]>([]);
const showEditModal = ref(false);
const formMode = ref<"add" | "edit">("add");
const currentEditData = ref<any>(null);

/**
 * 工具函数：掩码 API Key (保留前4后4，中间替换为***)
 * @param key API 密钥
 * @returns 掩码后的 API 密钥
 */
const maskApiKey = (key: string) => {
  if (!key || key.length < 8) return "******";
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
};

/** 打开新增弹窗 */
const openAddModal = () => {
  formMode.value = "add";
  currentEditData.value = null;
  showEditModal.value = true;
};

/** 打开编辑弹窗 */
const openEditModal = (item: any) => {
  formMode.value = "edit";
  currentEditData.value = item;
  showEditModal.value = true;
};

/**
 * 处理删除 API Key
 * @param id API 密钥 ID
 */
const handleDelete = (id: string) => {
  keyList.value = keyList.value.filter((k) => k.id !== id);
  window.$message?.success(t("dialog.apiKeyManage.msg.deleteSuccess"));
};

/**
 * 处理表单提交 (新增或编辑)
 * @param data 表单数据
 */
const handleFormSubmit = (data: any) => {
  if (formMode.value === "add") {
    data.id = Date.now().toString();
    keyList.value.push(data);
    window.$message?.success(t("dialog.apiKeyManage.msg.addSuccess"));
  } else {
    const index = keyList.value.findIndex((k) => k.id === data.id);
    if (index !== -1) {
      keyList.value[index] = data;
      window.$message?.success(t("dialog.apiKeyManage.msg.saveSuccess"));
    }
  }
  showEditModal.value = false;
};
</script>
