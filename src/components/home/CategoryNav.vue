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
      :tab="category.name"></n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { getLiveCategoryApi } from "@/api/live.ts";

defineOptions({
  name: "CategoryNav"
});

interface Category {
  name: string;
  value: string;
}

interface Props {
  activeCategory: string;
}

// 分类列表
const categories = ref<Category[]>([{ name: "全部", value: "all" }]);

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
  getLiveCategoryApi().then((res) => categories.value.push(...res));
});
</script>

<style scoped lang="scss">
:deep(.n-tabs-tab-pad) {
  width: 20px;
}
</style>
