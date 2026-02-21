<template>
  <div ref="ContextMenuRef">
    <slot></slot>
    <Teleport to="body" :disabled="ignoreTeleport">
      <transition-group @beforeEnter="handleBeforeEnter" @enter="handleEnter">
        <div
          v-if="!isMobile() && showMenu"
          class="context-menu select-none"
          :style="{
            left: `${pos.posX}px`,
            top: `${pos.posY}px`
          }">
          <div
            v-resize="handleSize"
            v-if="(visibleMenu && visibleMenu.length > 0) || (visibleSpecialMenu && visibleSpecialMenu.length > 0)"
            class="menu-list">
            <div v-for="(item, index) in visibleMenu" :key="index">
              <div class="menu-item-disabled" v-if="item.disabled" @click.prevent="$event.preventDefault()">
                <div class="menu-item-content">
                  <svg v-if="getMenuItemProp(item, 'icon')">
                    <use :href="`#${getMenuItemProp(item, 'icon')}`"></use>
                  </svg>
                  <p class="h-24px">{{ getMenuItemProp(item, "label") }}</p>
                </div>
              </div>
              <div
                class="menu-item"
                :class="{ 'menu-item-danger': isDangerousItem(item) }"
                v-else
                @click="handleClick(item)"
                @mouseenter="handleMouseEnter(item, index)"
                @mouseleave="handleMouseLeave">
                <div class="menu-item-content">
                  <svg v-if="getMenuItemProp(item, 'icon')">
                    <use :href="`#${getMenuItemProp(item, 'icon')}`"></use>
                  </svg>
                  <p class="h-24px">{{ getMenuItemProp(item, "label") }}</p>
                  <svg v-if="shouldShowArrow(item)" class="arrow-icon">
                    <use href="#right"></use>
                  </svg>
                </div>
              </div>
            </div>

            <div v-if="visibleSpecialMenu.length > 0" class="flex-col-y-center gap-6px">
              <div v-if="visibleMenu && visibleMenu.length > 0" class="h-1px bg-[--line-color] m-[2px_8px]"></div>
              <div
                @click="handleClick(item)"
                class="menu-item"
                :class="{ 'menu-item-danger': isDangerousItem(item) }"
                v-for="item in visibleSpecialMenu"
                :key="item.label">
                <svg v-if="getMenuItemProp(item, 'icon')">
                  <use :href="`#${getMenuItemProp(item, 'icon')}`"></use>
                </svg>
                <p class="h-24px">{{ getMenuItemProp(item, "label") }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showSubmenu && activeSubmenu" class="context-submenu" :style="submenuPosition">
          <div class="menu-list">
            <div
              v-for="(subItem, subIndex) in activeSubmenu"
              :key="subIndex"
              class="menu-item"
              :class="{ 'menu-item-danger': isDangerousItem(subItem) }">
              <div class="menu-item-content" @click="handleSubItemClick(subItem)">
                <svg v-if="getMenuItemProp(subItem, 'icon')" class="check-icon">
                  <use :href="`#${getMenuItemProp(subItem, 'icon')}`"></use>
                </svg>
                <p class="h-24px">{{ getMenuItemProp(subItem, "label") }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition-group>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { isMobile } from "@/utils/PlatformUtils";
import { useViewport } from "@/hooks/useViewport.ts";
import { useContextMenu } from "@/hooks/useContextMenu.ts";

type Props = {
  content?: Record<string, any>;
  menu?: any[];
  specialMenu?: any[];
  ignoreTeleport?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  content: () => ({}),
  menu: () => [],
  specialMenu: () => [],
  ignoreTeleport: false
});

// 使用计算属性过滤显示的菜单项
const visibleMenu = computed(() => {
  return props.menu?.filter((item: any) => {
    if (typeof item.visible === "function") {
      return item.visible(props.content);
    }
    return true;
  });
});

// 添加 specialMenu 的过滤功能
const visibleSpecialMenu = computed(() => {
  return props.specialMenu?.filter((item: any) => {
    if (typeof item.visible === "function") {
      return item.visible(props.content);
    }
    return true;
  });
});

/** 判断是否传入了menu */
const isNull = computed(() => props.menu === void 0);
const ContextMenuRef = useTemplateRef("ContextMenuRef");
const emit = defineEmits(["select", "menu-show"]);
/** 获取鼠标位置和是否显示右键菜单 */
const { x, y, showMenu } = useContextMenu(ContextMenuRef, isNull);

// 监听showMenu状态变化并向父组件发送事件
watch(
  () => showMenu.value,
  (newVal) => {
    emit("menu-show", newVal);
  },
  { immediate: true }
);

/** 获取视口的宽高 */
const { vw, vh } = useViewport();
/** 定义右键菜单尺寸 */
const w = ref(0);
const h = ref(0);
// 二级菜单状态
const showSubmenu = ref(false);
const activeSubmenu = ref<any[]>([]);
const submenuPosition = ref({
  left: "0px",
  top: "0px"
});

/** 计算右键菜单的位置 */
const pos = computed(() => {
  let posX = x.value;
  let posY = y.value;
  // x坐标
  if (x.value > vw.value - w.value) {
    posX -= w.value;
  }
  // y坐标
  if (y.value > vh.value - h.value) {
    posY -= y.value - vh.value + h.value;
  }
  return {
    posX,
    posY
  };
});

// 添加 watch 监听主菜单显示状态
watch(
  () => showMenu.value,
  (newVal) => {
    if (!newVal) {
      showSubmenu.value = false;
      activeSubmenu.value = [];
    }
  }
);

const handleSize = ({ width, height }: any) => {
  w.value = width;
  h.value = height;
};

/** 处理右键主菜单点击事件 */
const handleClick = (item: string) => {
  nextTick(() => {
    showMenu.value = false;
    emit("select", item);
  });
};

// 处理子菜单项点击
const handleSubItemClick = (item: any) => {
  if (typeof item.click === "function") {
    item.click(props.content);
  }
  showSubmenu.value = false;
};

const handleBeforeEnter = (el: any) => {
  el.style.height = 0;
};

const handleEnter = (el: any) => {
  el.style.height = "auto";
  const h = el.clientHeight;
  el.style.height = 0;
  requestAnimationFrame(() => {
    el.style.height = `${h}px`;
  });
};

/**
 * 获取菜单项的属性值
 */
const getMenuItemProp = (item: any, prop: "icon" | "label") => {
  return typeof item[prop] === "function" ? item[prop](props.content) : item[prop];
};

const isDangerousItem = (item: any) => {
  const icon = getMenuItemProp(item, "icon");
  return ["logout", "forbid"].includes(icon);
};

const handleMouseEnter = (item: any, index: number) => {
  const hasChildren = typeof item.children === "function" ? true : Array.isArray(item.children);
  if (!hasChildren) {
    showSubmenu.value = false;
    return;
  }

  const children = typeof item.children === "function" ? item.children(props.content) : item.children;
  if (!children || children.length === 0) {
    showSubmenu.value = false;
    return;
  }

  const menuItem = document.querySelectorAll(".menu-item")[index];
  const rect = menuItem.getBoundingClientRect();

  const submenuWidth = 120;
  const submenuHeight = children.length * 30;

  let left = rect.right + 5;
  let top = rect.top;

  if (rect.right + submenuWidth > vw.value) {
    left = rect.left;
    top = rect.bottom + 5;
    if (top + submenuHeight > vh.value) {
      top = rect.top - submenuHeight - 5;
    }
  } else {
    if (rect.top + submenuHeight > vh.value) {
      top = vh.value - submenuHeight - 10;
    }
  }

  submenuPosition.value = {
    left: `${left}px`,
    top: `${top}px`
  };

  activeSubmenu.value = children;
  showSubmenu.value = true;
};

const handleMouseLeave = (e: MouseEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (relatedTarget?.closest(".context-submenu")) {
    return;
  }
  setTimeout(() => {
    if (!isMouseInSubmenu(e) && !isMouseInMainMenu(e)) {
      showSubmenu.value = false;
    }
  }, 100);
};

const isMouseInSubmenu = (e: MouseEvent) => {
  const submenu = document.querySelector(".context-submenu");
  if (!submenu) return false;
  const elementsUnderMouse = document.elementsFromPoint(e?.clientX || 0, e?.clientY || 0);
  return elementsUnderMouse.some((el) => el.closest(".context-submenu"));
};

const isMouseInMainMenu = (e: MouseEvent) => {
  const mainMenu = document.querySelector(".context-menu");
  if (!mainMenu) return false;
  const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
  return elementsUnderMouse.some((el) => el.closest(".context-menu"));
};

const shouldShowArrow = (item: any) => {
  const children = typeof item.children === "function" ? item.children(props.content) : item.children;
  return Array.isArray(children) && children.length > 0;
};
</script>

<style scoped lang="scss">
@use "@/styles/global/variable.scss" as *;

// 通用的menu-item样式
@mixin menu-item {
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    width: 16px;
    height: 16px;
  }
  .menu-item-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

// menu-list通用样式
@mixin menu-list {
  -webkit-backdrop-filter: blur(10px);
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .menu-item {
    @include menu-item();
    display: flex;
    align-items: center;
    &:hover {
      background-color: var(--bg-menu-hover);
      svg {
        animation: twinkle 0.3s ease-in-out;
      }
    }
  }
}

.context-menu {
  @include menu-item-style();
  .menu-list {
    @include menu-list();
    width: max-content;
    .menu-item-disabled {
      @include menu-item();
      color: var(--disabled-color);
      svg {
        color: var(--disabled-color);
      }
    }
    .menu-item-danger {
      color: #d03553;
      svg {
        color: #d03553;
      }
    }
  }
}

.context-submenu {
  position: fixed;
  z-index: 1000;
  @include menu-item-style();

  .menu-list {
    @include menu-list();
    min-width: 120px;
    .menu-item-danger {
      color: #d03553;
      svg {
        color: #d03553;
      }
    }
  }
}

.menu-item {
  .menu-item-content {
    display: grid;
    // 使用 auto 1fr auto，如果图标 v-if 为 false，文本会自动填充第一列，效果符合预期
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: 12px;
    width: max-content;
    position: relative;
    svg {
      flex-shrink: 0;
      min-width: 16px;
    }
    p {
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .arrow-icon {
      position: static;
      justify-self: end;
      width: 12px;
      height: 12px;
      color: var(--text-color);
    }

    .check-icon {
      width: 14px;
      height: 14px;
    }
  }
}
</style>
