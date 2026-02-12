<template>
  <div class="category-nav-container">
    <n-tabs
      v-model:value="localActiveCategory"
      @update:value="handleParentChange"
      type="line"
      size="medium"
      :bar-width="28"
      class="primary-tabs">
      <n-tab-pane v-for="category in categories" :key="category.value" :name="category.value" :tab="category.name" />
    </n-tabs>

    <div v-if="currentChildren.length > 0" class="secondary-wrapper">
      <n-scrollbar x-scrollable class="secondary-scroll">
        <n-tabs
          v-model:value="localActiveChildCategory"
          @update:value="handleChildChange"
          type="card"
          size="small"
          class="secondary-tabs">
          <n-tab-pane
            class="mb-1"
            v-for="child in currentChildren"
            :key="child.value"
            :name="child.value"
            :tab="child.name" />
        </n-tabs>
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLiveCategoryApi } from "@/api/live";

defineOptions({ name: "CategoryNav" });

interface CategoryInfo {
  name: string;
  value: string;
  children?: CategoryInfo[];
}

interface Props {
  activeCategory: string;
  activeChildCategory: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "category-change": [parentValue: string, childValue?: string];
}>();

const categories = ref<CategoryInfo[]>([{ name: "全部", value: "all", children: [] }]);

const localActiveCategory = ref(props.activeCategory);
const localActiveChildCategory = ref(props.activeChildCategory);

const currentChildren = computed(() => {
  const current = categories.value.find((c) => c.value === localActiveCategory.value);
  return current?.children || [];
});

watch(
  () => [props.activeCategory, props.activeChildCategory],
  ([newParent, newChild]) => {
    localActiveCategory.value = newParent;
    localActiveChildCategory.value = newChild;
  }
);

const handleParentChange = (val: string) => {
  localActiveCategory.value = val;
  const selectedCategory = categories.value.find((c) => c.value === val);
  let childValue = "all";
  if (selectedCategory?.children && selectedCategory.children.length > 0) {
    childValue = selectedCategory.children[0].value;
  }
  localActiveChildCategory.value = childValue;
  emit("category-change", val, childValue);
};

const handleChildChange = (val: string) => {
  localActiveChildCategory.value = val;
  emit("category-change", localActiveCategory.value, val);
};

onMounted(async () => {
  const res = (await getLiveCategoryApi()) as CategoryInfo[];
  if (res) {
    res.forEach((item) => {
      if (item.children && Array.isArray(item.children)) {
        item.children.unshift({ name: "全部", value: "all" });
      }
    });
    const newCategories = res.filter((item: CategoryInfo) => item.value !== "all");
    categories.value.push(...newCategories);
  }
});
</script>

<style scoped lang="scss">
.category-nav-container {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.secondary-wrapper {
  margin-top: 8px;
  padding-left: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
}

.secondary-scroll {
  width: 100%;
}

.secondary-tabs {
  width: max-content;
  min-width: 100%;

  :deep(.n-tabs-nav) {
    border-bottom: none !important;
  }

  :deep(.n-tabs-tab) {
    padding: 4px 12px;
    font-size: 12px;
    border-radius: 12px;
    margin-right: 8px;
    border: none !important;
    transition: all 0.3s;

    &.n-tabs-tab--active {
      font-weight: 500;
    }
  }
}

:deep(.n-tabs-tab-pad) {
  width: 20px;
}

.primary-tabs {
  :deep(.n-tabs-nav-scroll-content) {
    border-bottom: none !important;
  }
}
</style>
