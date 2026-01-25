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
defineOptions({
  name: "CategoryNav"
});

interface Category {
  label: string;
  value: string;
}

interface Props {
  categories: Category[];
  activeCategory: string;
}

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
</script>

<style scoped lang="scss">
:deep(.n-tabs-tab-pad) {
  width: 20px;
}
</style>
