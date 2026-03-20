<template>
  <main
    class="flex size-full flex-col overflow-hidden bg-[--right-bg-color] text-[--text-color] transition-colors duration-300 select-none">
    <action-bar />
    <chat-panel
      :audience-list="audienceList"
      :chat-messages="chatMessages"
      :emoji-picker-style="{ bottom: '0', right: '0' }"
      @send-message="handleSendMessage" />
  </main>
</template>

<script setup lang="ts">
// 观众列表模拟数据
const audienceList = ref([
  {
    id: 1,
    name: "漂泊于旅途中的早川健",
    level: "Lv.12",
    avatar: "https://picsum.photos/id/1001/100/100",
    medals: ["⭐"]
  },
  {
    id: 2,
    name: "卡厄司岚那",
    level: "Lv.7",
    avatar: "https://picsum.photos/id/1002/100/100"
  },
  {
    id: 3,
    name: "吾爱有三",
    level: "Lv.34",
    avatar: "https://picsum.photos/id/1003/100/100",
    medals: ["🍐", "🍺", "🎯"]
  },
  {
    id: 4,
    name: "吾爱有三",
    level: "Lv.34",
    avatar: "https://picsum.photos/id/1003/100/100",
    medals: ["🍐", "🍺", "🎯"]
  },
  {
    id: 5,
    name: "吾爱有三",
    level: "Lv.34",
    avatar: "https://picsum.photos/id/1003/100/100",
    medals: ["🍐", "🍺", "🎯"]
  },
  {
    id: 6,
    name: "吾爱有三",
    level: "Lv.34",
    avatar: "https://picsum.photos/id/1003/100/100",
    medals: ["🍐", "🍺", "🎯"]
  },
  {
    id: 7,
    name: "吾爱有三",
    level: "Lv.34",
    avatar: "https://picsum.photos/id/1003/100/100",
    medals: ["🍐", "🍺", "🎯"]
  },
  {
    id: 8,
    name: "吾爱有三",
    level: "Lv.34",
    avatar: "https://picsum.photos/id/1003/100/100",
    medals: ["🍐", "🍺", "🎯"]
  }
]);

// 聊天消息模拟数据
const chatMessages = ref([
  {
    user: "眼里有✨星星✨河",
    level: "Lv.16",
    avatar: "https://picsum.photos/id/1004/100/100",
    content: "管理在吗"
  },
  {
    user: "AAA废品回收章哥",
    avatar: "https://picsum.photos/id/1005/100/100",
    content: "不接这种队友"
  },
  {
    user: "无尽星空",
    level: "Lv.9",
    avatar: "https://picsum.photos/id/1006/100/100",
    content: "乐子别介绍自己"
  },
  {
    user: "沐桑",
    level: "Lv.5",
    avatar: "https://picsum.photos/id/1007/100/100",
    content: "多少分了"
  },
  {
    user: "干啥呢",
    level: "Lv.7",
    avatar: "https://picsum.photos/id/1008/100/100",
    content: "你看这边是在自我介绍"
  },
  {
    user: "念旧",
    level: "Lv.7",
    avatar: "https://picsum.photos/id/1009/100/100",
    content: "那不是对面菜吗"
  },
  {
    user: "干啥呢",
    level: "Lv.7",
    avatar: "https://picsum.photos/id/1008/100/100",
    content: "信誉分不够，过来叫了"
  },
  {
    user: "蠢人偶",
    level: "Lv.3",
    avatar: "https://picsum.photos/id/1010/100/100",
    content: "中单太乙，边路东皇，游戏里遇到十有八九都是坑"
  },
  {
    user: "1001",
    level: "Lv.4",
    avatar: "https://picsum.photos/id/1011/100/100",
    content: "主播什么手机呀？"
  },
  {
    user: "JayChou",
    level: "Lv.12",
    avatar: "https://picsum.photos/id/1012/100/100",
    content: "演员还叫起来了😂"
  },
  {
    user: "Te滾世ぇ哆清",
    level: "Lv.14",
    avatar: "https://picsum.photos/id/1013/100/100",
    content: "来了"
  }
]);

/**
 * 处理发送消息事件
 * @param content 消息内容
 */
const handleSendMessage = (content: string) => {
  chatMessages.value.push({
    user: "1111",
    level: "Lv.200",
    avatar: "https://picsum.photos/id/1025/100/100",
    content: content
  });
};
</script>

<style scoped lang="scss"></style>
