<template>
  <div
    class="live-play-container relative w-full h-full bg-black flex select-none"
    :class="{ 'more-gifts-open': moreGiftsVisible }">
    <!-- 左侧内容区域 占3/4宽度，折叠时占100% -->
    <div
      :class="[
        'left-content',
        chatCollapsed ? 'w-full' : 'w-3/4',
        'h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out'
      ]">
      <!-- 顶部信息栏 固定高度 -->
      <div
        data-tauri-drag-region
        class="top-info-bar w-full h-12 bg-black/80 flex items-center justify-between px-2 z-999">
        <!-- 返回按钮和主播信息 -->
        <div class="flex items-center gap-3">
          <div
            @click="handleBack"
            class="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label="返回">
            <i-mdi-arrow-left class="w-6 h-6" />
          </div>

          <!-- 主播信息 -->
          <div class="host-info flex items-center gap-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            <div class="avatar w-8 h-8 rounded-full overflow-hidden border-2 border-red-500">
              <img src="https://picsum.photos/id/1/100/100" alt="主播头像" class="w-full h-full object-cover" />
            </div>
            <div class="host-info-text flex flex-col">
              <div class="host-name text-white font-medium">千年 (万年之主)</div>
              <div class="host-stats flex items-center gap-2 text-white/70 text-xs">
                <i-mdi-heart-outline class="w-3 h-3" />
                <span>2.9万</span>
              </div>
            </div>
            <div
              class="follow-btn bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition-colors">
              关注
            </div>
            <div
              class="group-btn bg-green-500 text-white text-xs px-3 py-1 rounded-full hover:bg-green-600 transition-colors">
              加粉丝团
            </div>
            <div
              class="vip-btn bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition-colors">
              加会员
            </div>
            <div
              class="more-btn w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <i-mdi-dots-horizontal class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- 观众数量和前三名头像 -->
        <div class="flex items-center gap-2 mr-5">
          <!-- 前三名头像 -->
          <div class="flex -space-x-2">
            <div
              v-for="(user, index) in audienceList.slice(0, 3)"
              :key="user.id"
              class="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
              :style="{ zIndex: 3 - index }">
              <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- 在线观众数 -->
          <div v-if="chatCollapsed" class="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <span class="audience-count text-white font-medium">{{ audienceCount }}</span>
          </div>

          <!-- 展开聊天区域按钮（仅在折叠状态显示） -->
          <div
            v-if="chatCollapsed"
            @click="toggleChat"
            class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer">
            <i-mdi-chevron-right class="w-5 h-5" />
          </div>
        </div>
      </div>

      <!-- 视频播放器区域 自适应剩余高度 -->
      <div
        class="player-container relative w-full flex-grow overflow-hidden"
        @mouseenter="controlsVisible = true"
        @mouseleave="controlsVisible = false">
        <video
          ref="videoRef"
          class="video-js vjs-big-play-centered object-contain"
          autoplay
          playsinline
          preload="auto"
          :controls="false">
          您的浏览器不支持视频播放。
        </video>

        <!-- 视频控制按钮 -->
        <div
          class="video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-30 transition-all duration-300 transform"
          :class="{
            'translate-y-full opacity-0': !shouldShowControls,
            'translate-y-0 opacity-100': shouldShowControls
          }">
          <div class="controls-container flex items-center justify-between">
            <!-- 左侧控制按钮 -->
            <div class="left-controls flex items-center gap-3">
              <!-- 播放/暂停按钮 -->
              <div class="control-btn" @click="togglePlay">
                <i-material-symbols-pause-rounded v-if="isPlaying" class="w-6 h-6 text-white" />
                <i-material-symbols-play-arrow-rounded v-else class="w-6 h-6 text-white" />
              </div>

              <!-- 刷新按钮 -->
              <div class="control-btn" @click="refreshVideo">
                <i-material-symbols-refresh-rounded class="w-5 h-5 text-white" />
              </div>
            </div>

            <!-- 右侧控制按钮 -->
            <div class="right-controls flex items-center gap-3">
              <!-- 清晰度控制 -->
              <div class="control-item">
                <n-dropdown :options="resolutionOptions" @select="switchResolution">
                  <div class="control-btn">
                    <span class="text-white text-sm">{{ currentResolution }}</span>
                  </div>
                </n-dropdown>
              </div>

              <!-- 屏幕旋转 -->
              <div class="control-btn" @click="toggleScreenRotation">
                <i-mdi-rotate-3d class="w-5 h-5 text-white" />
              </div>

              <!-- 弹幕设置 -->
              <div class="control-btn" @click="toggleDanmakuSettings">
                <i-material-symbols-settings class="w-5 h-5 text-white" />
              </div>

              <!-- 礼物设置 -->
              <div class="control-btn" @click="toggleGiftSettings">
                <i-mdi-gift class="w-5 h-5 text-white" />
              </div>

              <!-- 音量控制 -->
              <div
                class="control-btn volume-control relative"
                @mouseenter="showVolumeSlider = true"
                @mouseleave="showVolumeSlider = false">
                <i-ph-speaker-high v-if="volume > 50" class="w-5 h-5 text-white" />
                <i-ph-speaker-low v-else-if="volume > 0" class="w-5 h-5 text-white" />
                <i-ph-speaker-slash v-else class="w-5 h-5 text-white" />
                <div
                  class="volume-slider-container"
                  v-show="showVolumeSlider"
                  @mouseenter="showVolumeSlider = true"
                  @mouseleave="showVolumeSlider = false">
                  <n-slider v-model:value="volume" :min="0" :max="100" @update:value="setVolume" vertical />
                </div>
              </div>

              <!-- 小窗 -->
              <div class="control-btn" @click="toggleMiniWindow">
                <i-mdi-dock-window class="w-5 h-5 text-white" />
              </div>

              <!-- 窗口全屏 -->
              <div class="control-btn" @click="toggleWindowFullscreen">
                <i-material-symbols-fullscreen class="w-5 h-5 text-white" />
              </div>

              <!-- 全屏 -->
              <div class="control-btn" @click="toggleFullscreen">
                <i-material-symbols-fullscreen-exit v-if="isFullscreen" class="w-5 h-5 text-white" />
                <i-material-symbols-fullscreen v-else class="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 送礼区 固定高度 -->
      <div class="gift-area w-full h-20 bg-black/90 flex items-center p-2 z-999">
        <!-- 礼物列表 -->
        <div v-resize="calculateVisibleGiftCount" class="gift-list bg-amber flex items-center flex-1 rounded-md">
          <!-- 礼物容器，用于隐藏溢出的礼物 -->
          <div class="gifts-container flex items-center overflow-hidden w-full">
            <n-popover
              v-for="(gift, index) in displayGifts"
              :key="gift.id"
              trigger="hover"
              placement="top"
              :show-arrow="false"
              :raw="true"
              v-model:show="popoverVisible[gift.id]">
              <template #trigger>
                <div
                  class="gift-item-container flex flex-col items-center cursor-pointer flex-1 h-full relative overflow-visible transition-all duration-300">
                  <!-- 竖线分割 -->
                  <div
                    v-if="index > 0"
                    class="gift-divider absolute left-0 top-1/2 transform -translate-y-1/2 h-10 w-[1px] bg-white/20"></div>
                  <div
                    class="gift-item-content flex flex-col items-center justify-center h-full px-2 transition-all duration-300">
                    <div class="gift-icon rounded-full flex items-center justify-center mb-1">
                      <svg
                        :xmlns="gift.icon"
                        :width="24"
                        :height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-white">
                        <path :d="gift.path" />
                      </svg>
                    </div>
                    <div
                      class="gift-name text-white text-xs truncate max-w-full text-center transition-all duration-300">
                      {{ gift.name }}
                    </div>
                    <div class="gift-cost text-white text-xs opacity-70">{{ gift.cost }}钻</div>
                  </div>
                  <!-- 赠送按钮 -->
                  <div
                    class="gift-send-btn-container transition-all duration-300 opacity-0 transform translate-y-2 flex justify-center">
                    <div
                      class="gift-send-btn bg-red-500 text-white text-xs font-medium py-1 px-4 rounded-md cursor-pointer text-center"
                      @click="sendGiftWithAmount(gift, 1)">
                      赠送
                    </div>
                  </div>
                </div>
              </template>
              <div class="gift-amount-popover bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                <div class="gift-amount-grid grid grid-cols-4 gap-2">
                  <div
                    v-for="amount in amountOptions"
                    :key="amount.value"
                    @click="sendGiftWithAmount(gift, amount.value)"
                    class="amount-btn cursor-pointer px-4 py-2 bg-white/10 text-white rounded-full transition-all">
                    {{ amount.label }}
                  </div>
                </div>
              </div>
            </n-popover>

            <!-- 更多按钮 -->
            <div
              v-if="showMoreBtn"
              class="gift-item-container gift-more-container flex flex-col items-center cursor-pointer flex-1 h-full relative"
              @click="toggleMoreGifts">
              <!-- 竖线分割 -->
              <div
                v-if="displayGifts.length > 0"
                class="gift-divider absolute left-0 top-1/2 transform -translate-y-1/2 h-10 w-[1px] bg-white/20"></div>
              <div class="gift-item gift-more flex flex-col items-center justify-center h-full px-2">
                <div class="gift-icon rounded-full flex items-center justify-center mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-white">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div class="gift-name text-white text-xs truncate text-center">更多</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 充值按钮 -->
        <div
          @click="handleRechargeClick"
          class="cursor-pointer recharge-btn bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm px-3 h-full flex flex-col items-center justify-center rounded-md hover:opacity-90 transition-opacity ml-3 mr-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mb-1">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          充值 &gt;
        </div>
      </div>

      <!-- 礼物动画容器 -->
      <div class="gift-animation-container absolute inset-0 pointer-events-none overflow-hidden z-20"></div>

      <!-- 更多礼物弹窗 -->
      <div
        v-if="moreGiftsVisible"
        :class="[
          'more-gifts-popup absolute bottom-25 bg-black/95 backdrop-blur-sm rounded-lg border border-white/10 z-1000',
          chatCollapsed ? 'right-0' : 'right-[25%]'
        ]"
        style="width: 320px; max-height: 380px">
        <!-- 弹窗头部 -->
        <div class="more-gifts-header flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 class="text-white font-medium">更多礼物</h3>
          <div
            @click="closeMoreGifts"
            class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="关闭">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <!-- 礼物列表 -->
        <div class="more-gifts-content p-2">
          <n-scrollbar style="border-radius: 4px; max-height: 300px; min-height: 0">
            <div class="more-gifts-grid grid grid-cols-4 gap-2">
              <n-popover
                v-for="gift in remainingGifts"
                :key="gift.id"
                trigger="hover"
                placement="top"
                :show-arrow="false"
                :raw="true"
                v-model:show="popoverVisible[gift.id]">
                <template #trigger>
                  <div
                    class="gift-item-container flex flex-col items-center cursor-pointer p-2 bg-white/5 rounded-md hover:bg-white/10">
                    <div class="gift-icon rounded-full flex items-center justify-center my-1">
                      <svg
                        :xmlns="gift.icon"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-white">
                        <path :d="gift.path" />
                      </svg>
                    </div>
                    <div class="gift-name text-white text-xs truncate max-w-full text-center">
                      {{ gift.name }}
                    </div>
                    <div class="gift-cost text-white text-xs opacity-70">{{ gift.cost }}钻</div>
                    <!-- 赠送按钮 -->
                    <div class="gift-send-btn-container mt-2">
                      <div
                        class="gift-send-btn bg-red-500 text-white text-xs font-medium py-1 px-4 rounded-md w-full cursor-pointer hover:bg-red-600 transition-colors text-center"
                        @click="sendGiftWithAmount(gift, 1)">
                        赠送
                      </div>
                    </div>
                  </div>
                </template>
                <div class="gift-amount-popover bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                  <div class="gift-amount-grid grid grid-cols-4 gap-2">
                    <div
                      v-for="amount in amountOptions"
                      :key="amount.value"
                      @click="sendGiftWithAmount(gift, amount.value)"
                      class="amount-btn px-4 py-2 bg-white/10 text-white rounded-full transition-all cursor-pointer hover:bg-white/20">
                      {{ amount.label }}
                    </div>
                  </div>
                </div>
              </n-popover>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <!-- 充值弹窗 -->
      <div
        v-if="rechargeVisible"
        :class="[
          'recharge-popup absolute bottom-25 bg-black/98 rounded-lg border border-white/10 z-1000 overflow-hidden',
          chatCollapsed ? 'right-0' : 'right-[25%]'
        ]"
        style="width: 500px; max-height: 340px">
        <!-- 弹窗头部 -->
        <div class="recharge-header flex items-center justify-between px-4 py-3 bg-black">
          <h3 class="text-lg font-bold text-white">钻石充值</h3>
          <div class="flex items-center gap-4">
            <span class="text-sm text-white">余额 {{ balance }} 钻石</span>
            <div
              @click="closeRecharge"
              class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-all cursor-pointer"
              aria-label="关闭">
              <i-mdi-close />
            </div>
          </div>
        </div>

        <!-- 充值金额选项 -->
        <div class="recharge-amounts px-3 bg-black">
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="(option, index) in rechargeOptions"
              :key="index"
              @click="selectAmount(option.diamonds)"
              :class="[
                'recharge-option cursor-pointer rounded-md py-3 px-2 text-center transition-all duration-200 transform hover:scale-105',
                selectedAmount === option.diamonds
                  ? 'bg-red-500 text-white font-bold shadow-lg'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              ]">
              <div class="text-sm">{{ option.diamonds }}钻石</div>
              <div class="text-xs">¥{{ option.price }}</div>
            </div>
            <div
              @click="selectAmount(0)"
              :class="[
                'recharge-option cursor-pointer rounded-md py-3 px-2 text-center transition-all duration-200 transform hover:scale-105',
                selectedAmount === 0
                  ? 'bg-red-500 text-white font-bold shadow-lg'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              ]">
              <div class="text-sm">自定义金额</div>
              <div class="text-xs">最高100万元</div>
            </div>
          </div>
        </div>

        <!-- 扫码支付区域 -->
        <div class="recharge-payment py-2 px-3 bg-black border-t border-gray-800">
          <h4 class="text-md font-medium text-white mb-4">扫码支付</h4>
          <div class="payment-content flex flex-row gap-4 items-center">
            <!-- 二维码 -->
            <div class="qrcode-container bg-white rounded-sm shadow-lg">
              <i-material-symbols-qr-code class="w-20! h-20!" />
            </div>

            <!-- 支付信息区域 -->
            <div class="payment-info flex flex-col gap-2 flex-1">
              <!-- 应付金额 -->
              <div class="amount-info text-left">
                <div class="text-sm text-white">应付金额</div>
                <div class="text-xl font-bold text-red-500 mt-1">
                  ¥{{ rechargeOptions.find((opt) => opt.diamonds === selectedAmount)?.price || 0 }}
                </div>
              </div>

              <!-- 支付方式 -->
              <div class="payment-methods flex flex-col gap-2 w-full">
                <div class="methods-icons flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <i-material-symbols-live-tv class="text-blue-400" style="font-size: 20px" />
                  </div>
                  <div class="text-xs text-white/80">直播专属支付方式</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 充值按钮 -->
          <div class="recharge-footer p-4 bg-black border-t border-gray-800 mt-4">
            <button
              @click="handleRechargeSubmit"
              class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg">
              充值
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 占1/4宽度 -->
    <div
      v-if="!chatCollapsed"
      class="chat-container w-1/4 h-full bg-black/95 border-l border-white/10 flex flex-col transition-all duration-300 ease-in-out">
      <!-- 聊天头部 -->
      <div class="chat-header flex items-center justify-between p-3 border-b border-white/10 overflow-hidden">
        <div class="flex items-center gap-2 whitespace-nowrap overflow-hidden flex-1">
          <i-mdi-account-group class="text-white flex-shrink-0" />
          <span class="text-white font-medium whitespace-nowrap truncate">在线观众 · {{ audienceCount }}</span>
          <i-mdi-information-outline class="text-white/70 text-xs flex-shrink-0" />
        </div>
        <div
          @click="toggleChat"
          class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer flex-shrink-0">
          <i-mdi-chevron-left class="w-5 h-5" />
        </div>
      </div>

      <!-- 标签页 -->
      <div class="chat-tabs flex border-b border-white/10 min-w-0">
        <div
          v-for="tab in chatTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex-1 py-2 text-center text-sm transition-colors whitespace-nowrap min-w-0',
            activeTab === tab.id ? 'text-white font-medium border-b-2 border-red-500' : 'text-white/70 hover:text-white'
          ]">
          <div class="flex items-center justify-center min-w-0">
            <span class="truncate">{{ tab.name }}</span>
            <span v-if="tab.count !== undefined" class="text-xs text-white/50 ml-1 flex-shrink-0">
              ({{ tab.count }})
            </span>
          </div>
        </div>
      </div>

      <!-- 聊天内容区域 -->
      <div class="chat-content flex-grow flex flex-col overflow-hidden">
        <!-- 观众列表（上半部分） -->
        <div
          class="audience-list h-[155px] overflow-hidden transition-all duration-300 hover:h-1/2"
          @mouseenter="showUserCard = true"
          @mouseleave="handleAudienceListLeave">
          <n-scrollbar height="100%" ref="audienceScrollbar">
            <div class="p-2">
              <!-- 观众列表 -->
              <div
                v-for="(user, index) in audienceList"
                :key="user.id"
                class="audience-item flex items-center gap-2 py-2 px-3 hover:bg-white/5 rounded-md">
                <div
                  :class="[
                    'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                        ? 'bg-gray-300 text-gray-800'
                        : index === 2
                          ? 'bg-amber-700'
                          : 'bg-white/10'
                  ]">
                  {{ index + 1 }}
                </div>
                <div class="w-8 h-8 rounded-full overflow-hidden">
                  <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-white text-sm flex items-center gap-1 min-w-0">
                    <span class="truncate">{{ user.name }}</span>
                    <span v-if="user.medals && user.medals.length > 0" class="text-xs text-gray-300 flex-shrink-0">
                      {{ user.medals.join(" ") }}
                    </span>
                  </div>
                  <div class="text-white/70 text-xs">{{ user.level }}</div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>

        <!-- 聊天消息（下半部分） -->
        <div class="message-list flex-1 overflow-hidden border-t border-white/10 transition-all duration-300 relative">
          <!-- 用户信息卡片 -->
          <div
            v-if="showUserCard"
            class="user-info-card absolute top-0 left-0 right-0 z-10 transition-all duration-300">
            <div
              class="user-info-content flex items-center justify-between p-2 bg-black/80 backdrop-blur-md border-b border-white/10">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/id/1027/100/100" alt="用户头像" class="w-full h-full object-cover" />
                </div>
                <div>
                  <div class="text-white text-sm font-medium">元渊</div>
                  <div class="text-white/70 text-xs">Lv.12</div>
                </div>
              </div>
              <div class="text-white/70 text-xs">0</div>
            </div>
          </div>

          <n-scrollbar height="100%">
            <div class="p-2">
              <!-- 系统消息 -->
              <div class="system-message text-center py-2">
                <div class="inline-block px-3 py-1 bg-white/5 text-white/70 text-xs rounded-lg">
                  欢迎来到直播间！抖音严禁未成年人直播或礼物消费。严禁违法违规、低俗色情、吸烟酗酒、人身伤害等直播内容。理性消费，如主播在直播中以不当方式诱导消费，请谨慎辨别。切勿私下交易，以防人财两失，谨防网络诈骗。
                </div>
              </div>

              <!-- 用户消息 -->
              <div v-for="(message, index) in chatMessages" :key="index" class="message-item py-2">
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img :src="message.avatar" :alt="message.user" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1">
                      <span class="text-white text-xs font-medium truncate">{{ message.user }}</span>
                      <span v-if="message.level" class="text-white/50 text-xs flex-shrink-0">{{ message.level }}</span>
                    </div>
                    <div class="text-white text-sm mt-1 word-break-all">{{ message.content }}</div>
                  </div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <!-- 聊天输入区域 -->
      <div class="chat-input-area p-3 border-t border-white/10">
        <div class="danmaku-input-wrapper">
          <div class="emoji-btn" @mouseenter="showEmojiPickerHover" @mouseleave="hideEmojiPickerHover">
            <i-mdi-emoticon-outline class="emoji-icon" />
          </div>
          <input
            v-model="messageInput"
            type="text"
            placeholder="与大家互动一下..."
            class="danmaku-input-field"
            @keyup.enter="sendMessage" />
          <div class="send-btn" @click="sendMessage">
            <i-mdi-send class="send-icon" />
          </div>

          <div
            v-if="showEmojiPicker"
            class="emoji-picker-wrapper"
            @mouseenter="handleEmojiPickerEnter"
            @mouseleave="handleEmojiPickerLeave">
            <emoji-picker @select-emoji="handleSelectEmoji" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";

const router = useRouter();
const videoRef = ref<HTMLVideoElement | null>(null);
let player: any = null;

// 跟踪每个popover的显示状态
const popoverVisible = ref<Record<number, boolean>>({});

// 控制更多礼物弹窗的显示状态
const moreGiftsVisible = ref(false);

// 控制充值弹窗的显示状态
const rechargeVisible = ref(false);

// 选中的充值金额
const selectedAmount = ref(60);

// 用户余额
const balance = ref(0);

// 聊天输入相关状态
const showEmojiPicker = ref(false);
let emojiPickerHideTimer: number | null = null;
// 控制用户信息卡片的显示/隐藏
const showUserCard = ref(false);
// 观众列表滚动条引用
const audienceScrollbar = ref<any>(null);
// 视频控制相关状态
const isPlaying = ref(true);
const volume = ref(70);
const isScreenRotated = ref(false);
const currentResolution = ref("自动");
const isFullscreen = ref(false);
const showVolumeSlider = ref(false);
const controlsVisible = ref(false);

// 计算控制条是否应该显示
const shouldShowControls = computed(() => {
  return controlsVisible.value || !isPlaying.value;
});

// 清晰度选项
const resolutionOptions = [
  { label: "超清2K", key: "2k" },
  { label: "高清1080P", key: "1080p" },
  { label: "高清720P", key: "720p" },
  { label: "标清540P", key: "540p" },
  { label: "自动", key: "auto" }
];

// 动画帧ID存储
let animationFrameIds: number[] = [];

// 动画元素存储
let animationElements: HTMLElement[] = [];

// 聊天相关状态
const chatCollapsed = ref(false);
const activeTab = ref("all");
const audienceCount = ref(1492);
const messageInput = ref("");

// 聊天标签页
const chatTabs = [
  { id: "all", name: "全部" },
  { id: "contributor", name: "1000贡献用户", count: 0 },
  { id: "vip", name: "高等级用户" }
];

// 当前用户信息
const currentUser = {
  name: "当前用户",
  level: "Lv.10"
};

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

// 计算剩余未显示的礼物列表
const remainingGifts = computed(() => {
  return gifts.slice(visibleGiftCount.value - 1);
});

// 切换更多礼物弹窗
const toggleMoreGifts = () => {
  // 关闭充值弹窗
  rechargeVisible.value = false;
  moreGiftsVisible.value = !moreGiftsVisible.value;
};

// 关闭更多礼物弹窗
const closeMoreGifts = () => {
  moreGiftsVisible.value = false;
};

// 礼物数据
const gifts = [
  {
    id: 1,
    name: "爱心",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    cost: 1
  },
  {
    id: 2,
    name: "人气榜",
    icon: "http://www.w3.org/2000/svg",
    path: "M16 3.13a4 4 0 0 1 0 7.75 4 4 0 0 1 0-7.75zM9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H5z",
    cost: 1
  },
  {
    id: 3,
    name: "雪落花",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z",
    cost: 99
  },
  {
    id: 4,
    name: "Thuglife",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2l1.41 1.41L16.83 7H21v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7h4.17L10.59 3.41L12 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z",
    cost: 99
  },
  {
    id: 5,
    name: "大啤酒",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2l1.41 1.41L16.83 7H21v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7h4.17L10.59 3.41L12 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z",
    cost: 2
  },
  {
    id: 6,
    name: "冬雪之爱",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z",
    cost: 99
  },
  {
    id: 7,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 10,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 11,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 12,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 13,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 14,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 15,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 16,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 17,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 18,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 19,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 20,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 8,
    name: "鲜花",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 10
  },
  {
    id: 9,
    name: "拯救爱播",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z",
    cost: 299
  }
];

// 礼物数量选项
const amountOptions = [
  { label: "1个", value: 1 },
  { label: "10个", value: 10 },
  { label: "66个", value: 66 },
  { label: "188个", value: 188 },
  { label: "520个", value: 520 },
  { label: "999个", value: 999 },
  { label: "1314个", value: 1314 }
];

// 充值金额选项
const rechargeOptions = [
  { diamonds: 60, price: 6 },
  { diamonds: 10, price: 1 },
  { diamonds: 300, price: 30 },
  { diamonds: 1000, price: 100 },
  { diamonds: 2980, price: 298 },
  { diamonds: 5980, price: 598 },
  { diamonds: 19980, price: 1998 }
];

// 可显示的礼物数量
const visibleGiftCount = ref(4);

// 计算显示的礼物列表
const displayGifts = computed(() => {
  return gifts.slice(0, visibleGiftCount.value - 1);
});

// 是否显示更多按钮
const showMoreBtn = computed(() => {
  return gifts.length > visibleGiftCount.value - 1;
});

// 计算可显示的礼物数量
const calculateVisibleGiftCount = ({ width }: { width: number }) => {
  // 单个礼物项最小宽度（包含图标、文字和内边距）
  const minGiftWidth = 80;
  // 计算可显示的礼物数量
  let count = Math.floor(width / minGiftWidth);
  // 确保至少显示2个礼物和1个更多按钮
  count = Math.max(count, 2);
  visibleGiftCount.value = count;
};

// 返回上一页
const handleBack = () => {
  router.back();
};

// 处理充值按钮点击
const handleRechargeClick = () => {
  // 关闭更多礼物弹窗
  moreGiftsVisible.value = false;
  rechargeVisible.value = !rechargeVisible.value;
};

// 关闭充值弹窗
const closeRecharge = () => {
  rechargeVisible.value = false;
};

// 选择充值金额
const selectAmount = (diamonds: number) => {
  selectedAmount.value = diamonds;
};

// 处理充值提交
const handleRechargeSubmit = () => {
  console.log(`充值 ${selectedAmount.value} 钻石`);
  // 这里可以添加充值提交的逻辑，比如调用API等
  // 充值成功后可以关闭弹窗并更新余额
  closeRecharge();
};

// 赠送礼物带数量
const sendGiftWithAmount = (gift: any, amount: number) => {
  console.log(`赠送礼物：${gift.name} x ${amount}`);
  // 这里可以添加礼物发送的逻辑，比如调用API等
  // 发送成功后可以添加礼物动画效果
  createGiftAnimation(gift, amount);
  // 关闭对应的popover
  popoverVisible.value[gift.id] = false;
};

// 创建礼物动画
const createGiftAnimation = (gift: any, amount: number) => {
  const container = document.querySelector(".gift-animation-container");
  if (!container) return;

  // 创建礼物动画元素
  const animationEl = document.createElement("div");
  animationEl.className = "gift-animation-item absolute";
  animationEl.innerHTML = `
    <div class="gift-animation-content flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
      <div class="gift-icon w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <path d="${gift.path}"/>
        </svg>
      </div>
      <span class="gift-name text-white text-sm">${gift.name} x ${amount}</span>
    </div>
  `;

  // 设置初始位置
  animationEl.style.bottom = "10%";
  animationEl.style.left = "50px";
  animationEl.style.transform = "translateY(100%)";
  animationEl.style.opacity = "0";
  animationEl.style.transition = "none";

  container.appendChild(animationEl);
  animationElements.push(animationEl);

  // 使用requestAnimationFrame触发动画
  const startAnimation = () => {
    animationEl.style.transition = "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1)";
    animationEl.style.transform = "translateY(-50px)";
    animationEl.style.opacity = "1";
  };

  const animationId1 = requestAnimationFrame(() => {
    requestAnimationFrame(startAnimation);
  });
  animationFrameIds.push(animationId1);

  // 移除动画元素
  const removeAnimation = () => {
    animationEl.style.transition = "all 0.5s ease-out";
    animationEl.style.transform = "translateY(-100px)";
    animationEl.style.opacity = "0";

    const animationId2 = requestAnimationFrame(() => {
      setTimeout(() => {
        if (animationEl.parentNode) {
          animationEl.parentNode.removeChild(animationEl);
          // 从数组中移除
          const index = animationElements.indexOf(animationEl);
          if (index > -1) {
            animationElements.splice(index, 1);
          }
        }
      }, 500);
    });
    animationFrameIds.push(animationId2);
  };

  setTimeout(removeAnimation, 2000);
};

// 聊天相关方法
const toggleChat = () => {
  chatCollapsed.value = !chatCollapsed.value;
};
const sendMessage = () => {
  if (!messageInput.value.trim()) return;

  // 添加新消息到聊天列表
  chatMessages.value.push({
    user: currentUser.name,
    level: currentUser.level,
    avatar: "https://picsum.photos/id/1025/100/100",
    content: messageInput.value
  });

  // 清空输入框
  messageInput.value = "";
};

// 处理观众列表鼠标离开事件
const handleAudienceListLeave = () => {
  showUserCard.value = false;
  // 滚动到顶部，显示前三名观众
  setTimeout(() => {
    if (audienceScrollbar.value) {
      audienceScrollbar.value.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, 300); // 等待动画完成后再滚动
};

// 视频控制相关方法
const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  if (player) {
    if (isPlaying.value) {
      player.play();
      controlsVisible.value = false;
    } else {
      player.pause();
      controlsVisible.value = true;
    }
  }
};

const refreshVideo = () => {
  if (player) {
    player.load();
    player.play();
    isPlaying.value = true;
  }
};

const toggleScreenRotation = () => {
  isScreenRotated.value = !isScreenRotated.value;
  // 实际应用中这里会实现屏幕旋转的逻辑
  console.log("Toggle screen rotation:", isScreenRotated.value);
};
const toggleDanmakuSettings = () => {
  // 实际应用中这里会打开弹幕设置面板
  console.log("Toggle danmaku settings");
};

const toggleGiftSettings = () => {
  // 实际应用中这里会打开礼物设置面板
  console.log("Toggle gift settings");
};

const toggleMiniWindow = () => {
  // 实际应用中这里会切换到小窗模式
  console.log("Toggle mini window");
};

const toggleWindowFullscreen = () => {
  // 实际应用中这里会切换到窗口全屏模式
  console.log("Toggle window fullscreen");
};

const toggleFullscreen = () => {
  if (!player) return;

  const videoElement = player.el();
  if (!videoElement) return;

  if (!document.fullscreenElement) {
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if ((videoElement as any).webkitRequestFullscreen) {
      (videoElement as any).webkitRequestFullscreen();
    } else if ((videoElement as any).mozRequestFullScreen) {
      (videoElement as any).mozRequestFullScreen();
    } else if ((videoElement as any).msRequestFullscreen) {
      (videoElement as any).msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }
};

// 切换清晰度
const switchResolution = (key: string) => {
  currentResolution.value = key === "auto" ? "自动" : key.toUpperCase();
  console.log("Switch resolution to:", key);
  // 实际应用中这里会切换视频源
};

// 设置音量
const setVolume = (newVolume: number) => {
  volume.value = newVolume;
  if (player) {
    player.volume(newVolume / 100);
  }
  console.log("Set volume to:", newVolume);
};

// Emoji选择器相关逻辑
const showEmojiPickerHover = () => {
  showEmojiPicker.value = true;
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

const hideEmojiPickerHover = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

const handleEmojiPickerEnter = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

const handleEmojiPickerLeave = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

const handleSelectEmoji = (emoji: string) => {
  messageInput.value += emoji;
  showEmojiPicker.value = false;
};

onMounted(() => {
  // 初始化video.js播放器
  if (videoRef.value) {
    player = videojs(videoRef.value, {
      controls: false,
      autoplay: true,
      preload: "auto",
      responsive: true,
      fluid: false,
      bigPlayButton: false,
      controlBar: false,
      loadingSpinner: false,
      posterImage: false,
      textTrackDisplay: false,
      errorDisplay: false,
      pictureInPictureToggle: false,
      fullscreenToggle: false,
      // 添加FLV支持配置
      sources: [
        {
          src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: "application/x-mpegURL"
        }
      ],
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true
        }
      }
    });

    // 确保播放器尺寸正确
    player.on("ready", () => {
      const resizePlayer = () => {
        if (videoRef.value && player) {
          const container = videoRef.value.parentElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            player.width(rect.width);
            player.height(rect.height);
          }
        }
      };

      resizePlayer();
      window.addEventListener("resize", resizePlayer);
    });

    // 事件监听器
    player.on("play", () => {
      isPlaying.value = true;
      controlsVisible.value = false;
    });

    player.on("pause", () => {
      isPlaying.value = false;
      controlsVisible.value = true;
    });

    // 监听全屏状态变化
    document.addEventListener("fullscreenchange", () => {
      isFullscreen.value = !!document.fullscreenElement;
    });
    document.addEventListener("webkitfullscreenchange", () => {
      isFullscreen.value = !!(document as any).webkitFullscreenElement;
    });
    document.addEventListener("mozfullscreenchange", () => {
      isFullscreen.value = !!(document as any).mozFullScreenElement;
    });
    document.addEventListener("MSFullscreenChange", () => {
      isFullscreen.value = !!(document as any).msFullscreenElement;
    });
  }

  // 添加点击外部关闭弹窗的事件监听
  const handleClickOutside = (event: MouseEvent) => {
    // 关闭更多礼物弹窗
    const moreGiftsPopup = document.querySelector(".more-gifts-popup");
    const moreBtn = document.querySelector(".gift-more-container");
    if (
      moreGiftsVisible.value &&
      moreGiftsPopup &&
      !moreGiftsPopup.contains(event.target as Node) &&
      moreBtn &&
      !moreBtn.contains(event.target as Node)
    ) {
      closeMoreGifts();
    }

    // 关闭充值弹窗
    const rechargePopup = document.querySelector(".recharge-popup");
    const rechargeBtn = document.querySelector(".recharge-btn");
    if (
      rechargeVisible.value &&
      rechargePopup &&
      !rechargePopup.contains(event.target as Node) &&
      rechargeBtn &&
      !rechargeBtn.contains(event.target as Node)
    ) {
      closeRecharge();
    }
  };

  document.addEventListener("click", handleClickOutside);

  // 清理事件监听
  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
});

onUnmounted(() => {
  // 清理视频播放器
  if (player) {
    player.dispose();
    player = null;
  }

  // 清理动画帧
  animationFrameIds.forEach((id) => {
    cancelAnimationFrame(id);
  });
  animationFrameIds = [];

  // 清理动画元素
  animationElements.forEach((element) => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  animationElements = [];

  // 清理事件监听
  window.removeEventListener("resize", () => {});
});
</script>

<style scoped>
/* 控制按钮样式 */
.video-controls {
  transition: all 0.3s ease;
}

.controls-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-btn {
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-item {
  display: flex;
  align-items: center;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-control {
  position: relative;
}

.volume-control:hover .volume-slider-container {
  opacity: 1;
  transform: translateX(50%) translateY(0);
}

.volume-slider-container {
  position: absolute;
  bottom: 100%;
  right: 50%;
  transform: translateX(50%);
  width: 30px;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.95);
  border-radius: 8px;
  padding: 8px;
  opacity: 0;
  transform: translateX(50%) translateY(10px);
  transition: all 0.3s ease;
  z-index: 40;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar-container {
  transition: all 0.3s ease;
}

.progress-bar {
  --n-color-primary: #ff0050;
  --n-color-primary-light: #ff1a60;
  --n-color-primary-dark: #e60047;
  --n-height: 4px;
  --n-bezier: cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: 12px;
  color: #fff;
  margin-left: 8px;
}
.danmaku-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 6px;
  position: relative;
  width: 100%;
}

.emoji-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

.emoji-icon {
  width: 18px;
  height: 18px;
  color: #fff;
}

.danmaku-input-field {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 13px;
  outline: none;
  padding: 6px 0;
  max-width: none;
  width: 100%;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.send-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff0050;
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #ff1a60;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.send-icon {
  width: 16px;
  height: 16px;
}

.emoji-picker-wrapper {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 1000;
}

.live-play-container {
  overflow: hidden;
}

/* 送礼区样式 */
.gift-area {
  flex-shrink: 0;
}

.gift-list {
  min-width: 0;
  height: 100%;
}

/* 礼物容器，用于隐藏溢出的礼物 */
.gifts-container {
  min-width: 0;
  height: 100%;
}

.recharge-btn {
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* 礼物项容器 */
.gift-item-container {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;
  padding: 4px 0;
}

/* 竖线分割 */
.gift-divider {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.2);
}

.gift-name {
  font-size: 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-top: 2px;
  transition: all 0.3s ease;
}

.gift-cost {
  font-size: 9px;
  opacity: 0.7;
  margin-top: 1px;
}

/* 赠送按钮容器 */
.gift-send-btn-container {
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(2px);
  margin-top: 4px;
  width: 100%;
  pointer-events: none;
  height: 0;
  overflow: hidden;
  padding: 0 8px;
}

/* 赠送按钮样式 */
.gift-send-btn {
  font-size: 10px;
  font-weight: 500;
  padding: 4px 0;
  background-color: #ff0050;
  color: white;
  border-radius: 4px;
  width: 100%;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.2s ease;
}

/* 悬停效果 */
.gift-item-container:hover {
  height: auto;
  padding: 14px 0 14px 0;
  background-color: rgba(255, 0, 80, 0.1);
  border-radius: 4px;
  margin: -10px 0;
}

.gift-item-container:hover .gift-name {
  opacity: 0;
  height: 0;
  margin: 0;
  padding: 0;
  visibility: hidden;
}

.gift-item-container:hover .gift-send-btn-container {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  height: auto;
}

/* 更多按钮样式 - 固定，不需要动画 */
.gift-more-container {
  transition: none !important;
}

.gift-more-container:hover {
  height: 100% !important;
  padding: 4px 0 !important;
  background-color: transparent !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

.gift-more-container:hover .gift-name {
  opacity: 1 !important;
  height: auto !important;
  margin-top: 2px !important;
  padding: 0 !important;
  visibility: visible !important;
}

.gift-more {
  transition: none !important;
}

/* 观众数量样式 */
.audience-count {
  font-size: 14px;
  font-weight: 500;
}

/* 礼物动画样式 */
.gift-animation-container {
  pointer-events: none;
  overflow: hidden;
  z-index: 20;
}

.gift-animation-item {
  z-index: 100;
}

.gift-animation-content {
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.gift-animation-content .gift-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.gift-animation-content .gift-name {
  font-size: 14px;
  color: white;
  font-weight: 500;
}

/* 自定义video.js样式 */
:deep(.video-js) {
  width: 100%;
  height: 100%;
  --vjs-theme-sea-primary: #ff0000;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

:deep(.vjs-tech) {
  object-fit: contain !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.vjs-control-bar) {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
  padding: 10px 20px;
}

:deep(.vjs-button) {
  color: #fff;
  font-size: 16px;
}

:deep(.vjs-button:hover) {
  color: #ff0000;
}

:deep(.vjs-play-progress) {
  background-color: #ff0000;
}

:deep(.vjs-slider-bar) {
  background-color: #ff0000;
}

:deep(.vjs-big-play-button) {
  background-color: rgba(255, 0, 0, 0.7);
  border-color: #fff;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  margin-left: -40px;
  margin-top: -40px;
}

:deep(.vjs-big-play-button:hover) {
  background-color: rgba(255, 0, 0, 0.9);
  border-color: #fff;
  transform: scale(1.1);
}

:deep(.vjs-loading-spinner) {
  border-color: rgba(255, 0, 0, 0.5);
}

/* 自定义naive-ui样式 */
:deep(.n-popover) {
  z-index: 1000 !important;
}

.amount-btn {
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 500;
}

/* 礼物数量弹出框样式 */
.gift-amount-popover {
  min-width: 300px;
}

.gift-amount-grid {
  gap: 8px;
}

/* 更多礼物弹窗样式 */
.more-gifts-popup {
  transition: all 0.3s ease;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
}

/* 更多礼物弹窗头部样式 */
.more-gifts-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 更多礼物网格布局 */
.more-gifts-grid {
  gap: 8px;
}

/* 弹窗打开时，调整视频容器布局 */
.live-play-container.more-gifts-open .player-container {
  margin-right: 320px; /* 与弹窗宽度一致 */
  transition: margin-right 0.3s ease;
}

/* 充值弹窗打开时，不需要调整视频容器布局 */

/* 弹窗礼物项基础样式 - 固定高度并添加上下间距 */
.more-gifts-grid .gift-item-container {
  height: 80px !important;
  border-radius: 4px !important;
  transition: background-color 0.2s ease !important;
}

/* 弹窗礼物项hover效果 - 保持固定高度 */
.more-gifts-grid .gift-item-container:hover {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px !important;
  margin: 2px 0 !important;
  border-radius: 4px !important;
}

/* 确保弹窗礼物项的名称在hover时隐藏 */
.more-gifts-grid .gift-item-container:hover .gift-name {
  opacity: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  visibility: hidden !important;
}

/* 确保弹窗礼物项的赠送按钮容器样式正确 */
.more-gifts-grid .gift-item-container:hover .gift-send-btn-container {
  opacity: 1 !important;
  transform: none !important;
  pointer-events: auto !important;
  height: auto !important;
  margin-top: 2px !important;
}

/* 确保弹窗内的礼物数量弹窗层级更高 */
.more-gifts-popup :deep(.n-popover) {
  z-index: 1001 !important;
}

/* 充值弹窗样式已集成到类名中，无需额外样式 */
</style>
