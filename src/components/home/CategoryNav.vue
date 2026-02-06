<template>
  <n-tabs
    v-model:value="localActiveCategory"
    @update:value="handleCategoryChange"
    size="small"
    :show-tabbar="false"
    class="category-nav">
    <n-tab-pane
      v-for="category in categories"
      :key="category.value"
      :name="category.value"
      :tab="category.label"></n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { getLiveCategoryApi } from "@/api/live.ts";

defineOptions({
  name: "CategoryNav"
});

interface Category {
  label: string;
  value: string;
}

interface Props {
  activeCategory: string;
}

// 分类列表
const categories = ref<Category[]>([
  { label: "全部", value: "all" },
  { label: "聊天", value: "chat" },
  { label: "音乐", value: "music" },
  { label: "游戏", value: "game" },
  { label: "二次元", value: "anime" },
  { label: "舞蹈", value: "dance" },
  { label: "文化", value: "culture" },
  { label: "生活", value: "life" },
  { label: "运动", value: "sports" }
]);

const props = defineProps<Props>();

const emit = defineEmits<{
  "category-change": [category: string];
}>();

// 本地activeCategory，用于v-model
const localActiveCategory = ref(props.activeCategory);

// 监听props.activeCategory变化，更新本地activeCategory
watch(
  () => props.activeCategory,
  (newValue) => {
    localActiveCategory.value = newValue;
  }
);

const handleCategoryChange = (category: string) => {
  emit("category-change", category);
};

onMounted(() => {
  getLiveCategoryApi().then((res) => console.log(res));
});
</script>

<style scoped lang="scss">
:deep(.n-tabs-tab-pad) {
  width: 20px;
}
</style>
