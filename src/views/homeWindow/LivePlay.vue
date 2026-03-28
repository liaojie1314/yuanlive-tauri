<template>
  <div
    class="live-play-container relative flex h-full w-full bg-[--home-bg-color] select-none"
    :class="{ 'more-gifts-open': moreGiftsVisible }">
    <div
      :class="[
        'left-content',
        chatCollapsed ? 'w-full' : 'w-3/4',
        'flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out'
      ]">
      <div
        data-tauri-drag-region
        class="top-info-bar z-999 flex h-12 w-full items-center justify-between border-b border-[--line-color] bg-[--tray-bg-color] px-2">
        <div class="flex-y-center gap-3">
          <div
            aria-label="返回"
            class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[--bg-left-menu] text-[--action-bar-icon-color] transition-colors hover:bg-[--bg-left-menu-hover]"
            @click="handleBack">
            <i-mdi-arrow-left class="h-6 w-6" />
          </div>

          <div class="host-info flex-y-center gap-3 rounded-full bg-[--bg-left-menu] px-2 py-1 backdrop-blur-sm">
            <user-info-popover
              :user="{
                name: '千年 (万年之主)',
                avatar: 'https://picsum.photos/id/1/100/100',
                isBroadcaster: true,
                fanClubCount: 1000,
                vipCount: 500
              }">
              <div class="avatar h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-red-500">
                <img src="https://picsum.photos/id/1/100/100" alt="主播头像" class="h-full w-full object-cover" />
              </div>
            </user-info-popover>
            <div class="host-info-text flex flex-col">
              <user-info-popover
                :user="{
                  name: '千年 (万年之主)',
                  avatar: 'https://picsum.photos/id/1/100/100',
                  isBroadcaster: true,
                  fanClubCount: 1000,
                  vipCount: 500
                }">
                <div
                  class="host-name cursor-pointer font-medium text-[--text-color] transition-colors hover:text-[#ff0050]">
                  千年 (万年之主)
                </div>
              </user-info-popover>
              <div class="host-stats flex-y-center gap-2 text-xs text-[--user-text-color]">
                <i-mdi-heart-outline class="h-3 w-3" />
                <span>2.9万</span>
              </div>
            </div>
            <div
              class="follow-btn cursor-pointer rounded-full bg-red-500 px-3 py-1 text-xs text-white transition-colors hover:bg-red-600">
              关注
            </div>
            <div
              class="group-btn cursor-pointer rounded-full bg-green-500 px-3 py-1 text-xs text-white transition-colors hover:bg-green-600">
              加粉丝团
            </div>
            <div
              class="vip-btn cursor-pointer rounded-full bg-purple-500 px-3 py-1 text-xs text-white transition-colors hover:bg-purple-600">
              加会员
            </div>
            <n-popover
              trigger="hover"
              placement="bottom-end"
              style="
                padding: 12px;
                border-radius: 12px;
                background-color: var(--bg-popover);
                border: 1px solid var(--line-color);
              "
              :show-arrow="false">
              <template #trigger>
                <div
                  class="more-btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[--left-item-bg-color] text-[--action-bar-icon-color] transition-colors hover:bg-[--action-bar-icon-hover]">
                  <i-mdi-dots-horizontal class="h-5 w-5" />
                </div>
              </template>

              <div class="flex-y-center gap-2">
                <div
                  class="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[--bg-setting-item] px-5 py-2 text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]"
                  @click="copyRoomLink">
                  <i-mdi-link-variant class="h-4 w-4 opacity-80" />
                  <span class="text-sm font-medium">复制链接</span>
                </div>

                <div
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[--bg-setting-item] text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]">
                  <i-material-symbols-qr-code class="h-5 w-5 opacity-80" />
                </div>

                <div
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[--bg-setting-item] text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]"
                  @click="likeLive">
                  <i-mdi-heart-outline class="h-5 w-5 opacity-80" />
                </div>

                <div
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[--bg-setting-item] text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]"
                  @click="openReportDialog">
                  <i-mdi-alert-outline class="h-5 w-5 opacity-80" />
                </div>
              </div>
            </n-popover>
          </div>
        </div>

        <div class="mr-5 flex-y-center gap-2">
          <div class="flex -space-x-2">
            <div
              v-for="(user, index) in audienceList.slice(0, 3)"
              class="h-8 w-8 overflow-hidden rounded-full border-2 border-[--tray-bg-color]"
              :key="user.id"
              :style="{ zIndex: 3 - index }">
              <img class="h-full w-full object-cover" :src="user.avatar" :alt="user.name" />
            </div>
          </div>

          <div
            v-if="chatCollapsed"
            class="flex-y-center gap-2 rounded-full bg-[--bg-left-menu] px-3 py-1 backdrop-blur-sm">
            <span class="audience-count font-medium text-[--text-color]">{{ audienceCount }}</span>
          </div>

          <div
            v-if="chatCollapsed"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[--left-item-bg-color] text-[--action-bar-icon-color] transition-colors hover:bg-[--action-bar-icon-hover]"
            @click="toggleChat">
            <i-mdi-chevron-right class="h-5 w-5" />
          </div>
        </div>
      </div>

      <div
        class="player-container relative flex w-full flex-grow items-center justify-center overflow-hidden bg-black"
        @mouseenter="controlsVisible = true"
        @mouseleave="controlsVisible = false">
        <video
          ref="videoRef"
          autoplay
          playsinline
          class="h-full w-full object-contain"
          :controls="false"
          @play="isPlaying = true"
          @pause="isPlaying = false"></video>

        <danmaku-player ref="danmakuPlayerRef" />

        <div
          class="video-controls absolute right-0 bottom-0 left-0 z-30 transform bg-gradient-to-t from-black/80 to-transparent p-3 transition-all duration-300"
          :class="{
            'translate-y-full opacity-0': !shouldShowControls,
            'translate-y-0 opacity-100': shouldShowControls
          }">
          <div class="controls-container flex-between-center">
            <div class="left-controls flex-y-center gap-3">
              <div class="control-btn" @click="togglePlay">
                <i-material-symbols-pause-rounded v-if="isPlaying" class="h-6 w-6 text-white" />
                <i-material-symbols-play-arrow-rounded v-else class="h-6 w-6 text-white" />
              </div>

              <div class="control-btn" @click="refreshVideo">
                <i-material-symbols-refresh-rounded class="h-5 w-5 text-white" />
              </div>
            </div>

            <div class="right-controls flex-y-center gap-3">
              <div class="control-item">
                <n-dropdown :options="resolutionOptions" @select="switchResolution">
                  <div class="control-btn">
                    <span class="text-sm text-white">{{ currentResolution }}</span>
                  </div>
                </n-dropdown>
              </div>

              <div class="control-btn" @click="toggleScreenRotation">
                <i-mdi-rotate-3d class="h-5 w-5 text-white" />
              </div>

              <div class="control-item relative" @mouseenter="showDanmakuSettings" @mouseleave="hideDanmakuSettings">
                <div class="control-btn">
                  <i-material-symbols-settings class="h-5 w-5 text-white" />
                </div>

                <div
                  v-if="showDanmakuSettingsPanel"
                  class="danmaku-settings-panel"
                  @mouseenter="handleSettingsPanelEnter"
                  @mouseleave="handleSettingsPanelLeave">
                  <div class="settings-header">
                    <span class="settings-title">{{ t("components.danmakuInput.settings") }}</span>
                    <div class="reset-btn" @click="danmakuStore.resetSettings">
                      <i-ph-arrow-counter-clockwise class="reset-icon" />
                      <span>{{ t("components.danmakuInput.reset") }}</span>
                    </div>
                  </div>

                  <div class="settings-content">
                    <div v-for="item in danmakuStore.sliderConfigs" class="settings-item" :key="item.key">
                      <span class="settings-label">{{ item.label }}</span>
                      <n-slider
                        v-model:value="danmakuStore.settings[item.key]"
                        :min="item.min"
                        :max="item.max"
                        :step="1"
                        :tooltip="false" />
                      <span class="settings-value-right">{{ danmakuStore.textValues[item.key] }}</span>
                    </div>

                    <div class="settings-divider"></div>

                    <div class="settings-item">
                      <span class="settings-label">{{ t("components.danmakuInput.position") }}</span>
                      <div class="position-options">
                        <div
                          class="position-btn"
                          :class="{ active: danmakuStore.position === 'scroll' }"
                          @click="danmakuStore.position = 'scroll'">
                          {{ t("components.danmakuInput.scroll") }}
                        </div>
                        <div
                          class="position-btn"
                          :class="{ active: danmakuStore.position === 'top' }"
                          @click="danmakuStore.position = 'top'">
                          {{ t("components.danmakuInput.top") }}
                        </div>
                        <div
                          class="position-btn"
                          :class="{ active: danmakuStore.position === 'bottom' }"
                          @click="danmakuStore.position = 'bottom'">
                          {{ t("components.danmakuInput.bottom") }}
                        </div>
                      </div>
                    </div>

                    <div class="settings-divider"></div>

                    <div class="settings-item">
                      <span class="settings-label">{{ t("components.danmakuInput.preventObscuring") }}</span>
                      <div class="settings-arrow">
                        <n-switch class="control-switch" v-model:value="danmakuStore.settings.antiBlock" />
                      </div>
                    </div>

                    <div class="settings-item">
                      <span class="settings-label">{{ t("components.danmakuInput.mergeSameDanmaku") }}</span>
                      <div class="settings-arrow">
                        <n-switch class="control-switch" v-model:value="danmakuStore.settings.enableCombo" />
                      </div>
                    </div>

                    <div class="settings-item">
                      <span class="settings-label">{{ t("components.danmakuInput.danmakuSwitch") }}</span>
                      <div class="settings-arrow">
                        <n-switch class="control-switch" v-model:value="danmakuStore.settings.enabled" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="control-item relative" @mouseenter="showGiftSettings" @mouseleave="hideGiftSettings">
                <div class="control-btn">
                  <i-mdi-gift class="w-5 h-5 text-white" />
                </div>

                <div
                  v-if="showGiftSettingsPanel"
                  class="gift-settings-panel"
                  @mouseenter="handleGiftSettingsPanelEnter"
                  @mouseleave="handleGiftSettingsPanelLeave">
                  <div class="settings-header">
                    <span class="settings-title">礼物设置</span>
                  </div>

                  <div class="settings-content">
                    <div class="settings-item">
                      <span class="settings-label">送礼信息提示</span>
                      <div class="settings-arrow">
                        <n-switch class="control-switch" v-model:value="giftStore.settings.showGiftMessages" />
                      </div>
                    </div>

                    <div class="settings-item">
                      <span class="settings-label">屏蔽礼物特效</span>
                      <div class="settings-arrow">
                        <n-switch class="control-switch" v-model:value="giftStore.settings.hideEffects" />
                      </div>
                    </div>

                    <div class="settings-item">
                      <span class="settings-label">快捷键送礼</span>
                      <div class="settings-arrow">
                        <n-switch class="control-switch" v-model:value="giftStore.settings.enableShortcut" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="control-btn volume-control relative"
                @mouseenter="showVolumeSlider = true"
                @mouseleave="showVolumeSlider = false"
                @wheel.prevent="handleVolumeWheel"
                @click="toggleMute">
                <i-ph-speaker-high v-if="volume > 50" class="h-5 w-5 text-white" />
                <i-ph-speaker-low v-else-if="volume > 0" class="h-5 w-5 text-white" />
                <i-ph-speaker-slash v-else class="h-5 w-5 text-white" />

                <div
                  v-show="showVolumeSlider"
                  class="volume-slider-container"
                  @mouseenter="showVolumeSlider = true"
                  @mouseleave="showVolumeSlider = false"
                  @click.stop>
                  <n-slider vertical v-model:value="volume" :min="0" :max="100" @update:value="setVolume" />
                </div>
              </div>

              <div class="control-btn" @click="toggleMiniWindow">
                <i-mdi-dock-window class="h-5 w-5 text-white" />
              </div>

              <div class="control-btn" @click="toggleFullscreen">
                <i-material-symbols-fullscreen-exit v-if="isFullscreen" class="h-5 w-5 text-white" />
                <i-material-symbols-fullscreen v-else class="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="gift-area z-999 flex h-20 w-full items-center border-t border-[--line-color] bg-[--tray-bg-color] p-2">
        <div
          v-resize="calculateVisibleGiftCount"
          class="gift-list flex flex-1 items-center rounded-md bg-[--tray-bg-color]">
          <div class="gifts-container flex w-full items-center overflow-hidden">
            <n-popover
              v-for="gift in displayGifts"
              trigger="hover"
              placement="top"
              v-model:show="popoverVisible[gift.id]"
              :key="gift.id"
              :show-arrow="false"
              :raw="true">
              <template #trigger>
                <div
                  class="gift-item-container relative flex h-full flex-1 cursor-pointer flex-col items-center overflow-visible transition-all duration-300">
                  <div
                    class="gift-item-content flex h-full flex-col items-center justify-center px-2 transition-all duration-300">
                    <div class="gift-icon mb-1 flex-center rounded-full">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-[--text-color]"
                        :xmlns="gift.icon"
                        :width="24"
                        :height="24">
                        <path :d="gift.path" />
                      </svg>
                    </div>
                    <div
                      class="gift-name max-w-full truncate text-center text-xs text-[--text-color] transition-all duration-300">
                      {{ gift.name }}
                    </div>
                    <div class="gift-cost text-xs text-[--user-text-color]">{{ gift.cost }}钻</div>
                  </div>
                  <div
                    class="gift-send-btn-container flex translate-y-2 transform justify-center opacity-0 transition-all duration-300">
                    <div
                      class="gift-send-btn cursor-pointer rounded-md bg-red-500 px-4 py-1 text-center text-xs font-medium text-white"
                      @click="sendGiftWithAmount(gift, 1)">
                      赠送
                    </div>
                  </div>
                </div>
              </template>
              <div
                class="gift-amount-popover rounded-lg border border-[--line-color] bg-[--bg-popover] p-3 shadow-lg backdrop-blur-sm">
                <div class="gift-amount-grid grid grid-cols-4 gap-2">
                  <div
                    v-for="amount in amountOptions"
                    class="amount-btn cursor-pointer rounded-full bg-[--bg-left-menu-hover] px-4 py-2 text-[--text-color] transition-all hover:bg-[--bg-menu-hover]"
                    :key="amount.value"
                    @click="sendGiftWithAmount(gift, amount.value)">
                    {{ amount.label }}
                  </div>
                </div>
              </div>
            </n-popover>

            <div
              v-if="showMoreBtn"
              class="gift-item-container gift-more-container relative flex h-full flex-1 cursor-pointer flex-col items-center"
              @click="toggleMoreGifts">
              <div class="gift-item gift-more flex h-full flex-col items-center justify-center px-2">
                <div class="gift-icon mb-1 flex-center rounded-full">
                  <i-mdi-plus class="h-6 w-6 text-[--text-color]" />
                </div>
                <div class="gift-name truncate text-center text-xs text-[--text-color]">更多</div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="recharge-btn mr-5 ml-3 flex h-full cursor-pointer flex-col items-center justify-center rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-3 text-sm text-white transition-opacity hover:opacity-90"
          @click="handleRechargeClick">
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

      <div class="gift-animation-container pointer-events-none absolute inset-0 z-20 overflow-hidden"></div>

      <div
        v-if="moreGiftsVisible"
        style="width: 320px; max-height: 380px"
        :class="[
          `more-gifts-popup absolute bottom-25 z-1000 rounded-lg border border-[--line-color] bg-[--bg-popover] shadow-xl backdrop-blur-sm`,
          chatCollapsed ? 'right-0' : 'right-[25%]'
        ]">
        <div class="more-gifts-header flex-between-center border-b border-[--line-color] px-4 py-3">
          <h3 class="font-medium text-[--text-color]">更多礼物</h3>
          <i-mdi-close
            class="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-[--left-item-bg-color] p-2 text-[--action-bar-icon-color] transition-colors hover:bg-[--action-bar-icon-hover]"
            @click="closeMoreGifts" />
        </div>

        <div class="more-gifts-content p-2">
          <n-scrollbar style="border-radius: 4px; max-height: 300px; min-height: 0">
            <div class="more-gifts-grid grid grid-cols-4 gap-2">
              <n-popover
                v-for="gift in remainingGifts"
                trigger="hover"
                placement="top"
                v-model:show="popoverVisible[gift.id]"
                :key="gift.id"
                :show-arrow="false"
                :raw="true">
                <template #trigger>
                  <div
                    class="gift-item-container flex cursor-pointer flex-col items-center rounded-md bg-[--bg-left-menu-hover] p-2 hover:bg-[--bg-menu-hover]">
                    <div class="gift-icon my-1 flex-center rounded-full">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-[--text-color]"
                        :xmlns="gift.icon">
                        <path :d="gift.path" />
                      </svg>
                    </div>
                    <div class="gift-name max-w-full truncate text-center text-xs text-[--text-color]">
                      {{ gift.name }}
                    </div>
                    <div class="gift-cost text-xs text-[--user-text-color]">{{ gift.cost }}钻</div>
                    <div class="gift-send-btn-container mt-2">
                      <div
                        class="gift-send-btn w-full cursor-pointer rounded-md bg-red-500 px-4 py-1 text-center text-xs font-medium text-white transition-colors hover:bg-red-600"
                        @click="sendGiftWithAmount(gift, 1)">
                        赠送
                      </div>
                    </div>
                  </div>
                </template>
                <div
                  class="gift-amount-popover rounded-lg border border-[--line-color] bg-[--bg-popover] p-3 shadow-lg backdrop-blur-sm">
                  <div class="gift-amount-grid grid grid-cols-4 gap-2">
                    <div
                      v-for="amount in amountOptions"
                      class="amount-btn cursor-pointer rounded-full bg-[--bg-left-menu-hover] px-4 py-2 text-[--text-color] transition-all hover:bg-[--bg-menu-hover]"
                      :key="amount.value"
                      @click="sendGiftWithAmount(gift, amount.value)">
                      {{ amount.label }}
                    </div>
                  </div>
                </div>
              </n-popover>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <div
        v-if="rechargeVisible"
        style="width: 500px; max-height: 340px"
        :class="[
          `recharge-popup absolute bottom-25 z-1000 overflow-hidden rounded-lg border border-[--line-color] bg-[--bg-modal] shadow-xl`,
          chatCollapsed ? 'right-0' : 'right-[25%]'
        ]">
        <div class="recharge-header flex-between-center border-b border-[--line-color] bg-[--bg-popover] px-4 py-3">
          <h3 class="text-lg font-bold text-[--text-color]">钻石充值</h3>
          <div class="flex-y-center gap-4">
            <span class="text-sm text-[--text-color]">余额 {{ balance }} 钻石</span>
            <div
              aria-label="关闭"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[--left-item-bg-color] text-[--action-bar-icon-color] transition-all hover:bg-red-500 hover:text-white"
              @click="closeRecharge">
              <i-mdi-close />
            </div>
          </div>
        </div>

        <div class="recharge-amounts bg-[--bg-popover] px-3 pt-3 pb-3">
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="(option, index) in rechargeOptions"
              :key="index"
              :class="[
                `recharge-option transform cursor-pointer rounded-md border-2 px-2 py-3 text-center transition-all duration-200 hover:scale-105`,
                selectedAmount === option.diamonds && !isCustomSelected
                  ? 'border-red-500 bg-red-500 font-bold text-white shadow-lg'
                  : 'border-transparent bg-[--bg-setting-item] text-[--text-color] hover:bg-[--bg-menu-hover]'
              ]"
              @click="selectFixedAmount(option.diamonds)">
              <div class="text-sm">{{ (option.diamonds * 1).toLocaleString() }} 钻石</div>
              <div
                class="mt-1 text-xs opacity-80"
                :class="
                  selectedAmount === option.diamonds && !isCustomSelected ? 'text-white' : 'text-[--user-text-color]'
                ">
                ¥{{ option.price }}
              </div>
            </div>

            <div
              :class="[
                `recharge-option flex transform cursor-pointer flex-col items-center justify-center rounded-md border-2 text-center transition-all duration-200 hover:scale-105`,
                isCustomSelected
                  ? 'border-red-500 bg-pink-100 px-1 py-2 shadow-sm'
                  : 'border-transparent bg-[--bg-setting-item] px-2 py-3 hover:bg-[--bg-menu-hover]'
              ]"
              @click="!confirmedCustomPrice ? openCustomInput() : (isCustomSelected = true)">
              <template v-if="confirmedCustomPrice > 0">
                <div class="text-[13px] font-bold text-[--text-color]">
                  {{ (confirmedCustomPrice * 10).toLocaleString() }} 钻石
                </div>
                <div class="mt-1 flex-center text-xs font-medium text-[--user-text-color]">
                  ¥{{ confirmedCustomPrice }}
                  <span class="ml-1 text-red-500" @click.stop="openCustomInput">修改</span>
                </div>
              </template>

              <template v-else>
                <div class="text-sm text-[--text-color]">自定义金额</div>
                <div class="mt-1 text-xs text-[--user-text-color] opacity-80">最高100万元</div>
              </template>
            </div>
          </div>
        </div>

        <div class="recharge-payment border-t border-[--line-color] bg-[--bg-popover] px-3 py-2">
          <h4 class="text-md mb-1 font-medium text-[--text-color]">扫码支付</h4>
          <div class="payment-content flex flex-row items-center gap-4">
            <div class="qrcode-container rounded-sm bg-white shadow-lg">
              <i-material-symbols-qr-code class="h-20! w-20! text-black" />
            </div>

            <div class="payment-info flex flex-1 flex-col gap-2">
              <div class="amount-info text-left">
                <div class="text-sm text-[--text-color]">应付金额</div>
                <div class="mt-1 text-xl font-bold text-red-500">¥{{ payPrice }}</div>
              </div>

              <div class="payment-methods flex w-full flex-col gap-2">
                <div class="methods-icons flex-y-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[--left-item-bg-color]">
                    <i-material-symbols-live-tv style="font-size: 20px" class="text-blue-400" />
                  </div>
                  <div class="text-xs text-[--user-text-color]">直播专属支付方式</div>
                </div>
              </div>
            </div>
          </div>

          <div class="recharge-footer mt-4 border-t border-[--line-color] bg-[--bg-popover] p-4">
            <button
              class="w-full transform rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-orange-600 hover:to-red-600"
              @click="handleRechargeSubmit">
              充值
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!chatCollapsed"
      class="chat-container flex h-full w-1/4 flex-col border-l border-[--line-color] bg-[--right-bg-color] transition-all duration-300 ease-in-out">
      <div class="chat-header flex-between-center overflow-hidden border-b border-[--line-color] p-3">
        <div class="flex flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
          <i-mdi-account-group class="flex-shrink-0 text-[--action-bar-icon-color]" />
          <span class="truncate font-medium whitespace-nowrap text-[--text-color]">在线观众 · {{ audienceCount }}</span>

          <n-popover
            trigger="hover"
            placement="bottom"
            style="
              padding: 16px;
              border-radius: 12px;
              background-color: var(--bg-popover);
              border: 1px solid var(--line-color);
              box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
            "
            :show-arrow="false">
            <template #trigger>
              <i-mdi-information-outline
                class="flex-shrink-0 cursor-help text-sm text-[--user-text-color] transition-colors hover:text-[--text-color]" />
            </template>

            <div class="flex w-72 flex-col gap-4 text-xs">
              <div class="text-sm font-bold text-[--text-color]">点赞和送礼后排序更新</div>

              <div>
                <div class="mb-1 font-bold text-[--text-color]">排序规则</div>
                <div class="leading-relaxed text-[--user-text-color]">
                  在线观众列表会默认进行排序，观众点赞30次或送出1钻石礼物，均有机会获得1点榜单值；每10分钟，单个用户可通过点赞获得5点榜单值，超出后将不再继续获得（高峰时段可能会有计值延迟或不稳定现象，均属正常）。
                </div>
              </div>

              <div>
                <div class="mb-1 font-bold text-[--text-color]">特别提醒</div>
                <div class="leading-relaxed text-[--user-text-color]">
                  此列表仅展示当前在直播间内用户互动情况，若离开直播间或退出重进后，列表信息会发生变化，请点击打开在线观众列表了解当前排名。因未登录或未绑定抖音账号、内容安全、技术限制等原因，部分观众虽然在观看直播，但无法展现在在线观众榜内。
                </div>
              </div>

              <div>
                <div class="mb-1 font-bold text-[--text-color]">1000贡献用户</div>
                <div class="leading-relaxed text-[--user-text-color]">
                  用户在本场直播中榜单值>1000，即可展示头像。达成10000榜单值，即使退出直播间也能在页面展示。优先展示当前在直播间的用户，本场直播先达到1000榜单值展示越靠前。
                </div>
              </div>

              <div>
                <div class="mb-1 font-bold text-[--text-color]">高等级用户</div>
                <div class="leading-relaxed text-[--user-text-color]">
                  直播间内用户荣誉等级>=31级，且在线榜单值>0，即可进行展示。等级阶段越高，展示越靠前，同一等级阶段按在线榜单值直排序，值越大越靠前。
                </div>
              </div>
            </div>
          </n-popover>
        </div>

        <div
          class="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-[--left-item-bg-color] text-[--action-bar-icon-color] transition-colors hover:bg-[--action-bar-icon-hover]"
          @click="toggleChat">
          <i-mdi-chevron-left class="h-5 w-5" />
        </div>
      </div>

      <chat-panel :audience-list="audienceList" :chat-messages="chatMessages" @send-message="handleSendMessage">
        <template #user-info-card>
          <div
            class="user-info-content flex-between-center border-b border-[--line-color] bg-[--bg-popover] p-2 backdrop-blur-md">
            <div class="flex-y-center gap-2">
              <div class="h-8 w-8 overflow-hidden rounded-full">
                <img src="https://picsum.photos/id/1027/100/100" alt="用户头像" class="h-full w-full object-cover" />
              </div>
              <div>
                <div class="text-sm font-medium text-[--text-color]">元渊</div>
                <div class="text-xs text-[--user-text-color]">Lv.12</div>
              </div>
            </div>
            <div class="text-xs text-[--user-text-color]">0</div>
          </div>
        </template>
      </chat-panel>
    </div>
  </div>
  <custom-amount-dialog
    v-model:show="customAmountInputVisible"
    :initial-value="confirmedCustomPrice"
    @confirm="handleCustomAmountConfirm" />
  <live-report-dialog room-id="1001" v-model:show="showReportDialog" @submit-report="handleLiveReport" />
</template>

<script setup lang="ts">
import mpegts from "mpegts.js";
import { useI18n } from "vue-i18n";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useGiftStore } from "@/stores/gift";
import { useDanmakuStore } from "@/stores/danmaku";

const { t } = useI18n();
const router = useRouter();
const giftStore = useGiftStore();
const danmakuStore = useDanmakuStore();
let unlistenResize: (() => void) | null = null;
const appWindow = WebviewWindow.getCurrent();
const videoRef = ref<HTMLVideoElement | null>(null);
let flvPlayer: mpegts.Player | null = null;
let danmakuSettingsHideTimer: number | null = null;
let giftSettingsHideTimer: number | null = null;

// 跟踪每个popover的显示状态
const popoverVisible = ref<Record<number, boolean>>({});
// 控制更多礼物弹窗的显示状态
const moreGiftsVisible = ref(false);
// 控制充值弹窗的显示状态
const rechargeVisible = ref(false);
const customAmountInputVisible = ref(false); // 控制输入弹窗显示
const confirmedCustomPrice = ref(0); // 确认后的自定义人民币金额
const isCustomSelected = ref(false); // 当前是否选中了自定义选项
const showReportDialog = ref(false);
// 选中的充值金额
const selectedAmount = ref(10);
// 用户余额
const balance = ref(0);
// 视频控制相关状态
const isPlaying = ref(true);
const volume = ref(70);
// 记录静音前的音量，初始值与当前默认音量保持一致
const previousVolume = ref(70);
const isScreenRotated = ref(false);
const currentResolution = ref("自动");
const isFullscreen = ref(false);
const showVolumeSlider = ref(false);
const controlsVisible = ref(false);
const showDanmakuSettingsPanel = ref(false);
const danmakuPlayerRef = ref<InstanceType<typeof DanmakuPlayer> | null>(null);
const showGiftSettingsPanel = ref(false);

// 3. 拦截用户发送聊天事件，顺便飘一条弹幕
const handleSendMessage = (content: string) => {
  chatMessages.value.push({
    user: currentUser.name,
    level: currentUser.level,
    avatar: "https://picsum.photos/id/1025/100/100",
    content: content
  });

  // 发送弹幕到视频层，并传入 true 标记这是自己发送的
  if (danmakuPlayerRef.value) {
    danmakuPlayerRef.value.addDanmaku(content, true);
  }
};

// 4. 模拟 WebSocket 接收弹幕数据
let mockWsInterval: number | null = null;
const mockDanmakuData = [
  "哈哈哈",
  "这操作神了！",
  "前面的等等我",
  "666666",
  "泪目",
  "前方高能反应",
  "主播太强了",
  "又下饭了",
  "233333",
  "啊啊啊啊啊啊啊"
];

const mockGiftData = [
  { userName: "奶茶波波冰", giftName: "粉丝团灯牌", count: 1 },
  { userName: "心上雪止", giftName: "粉丝团灯牌", count: 1 },
  { userName: "我叫裴之之", giftName: "粉丝团灯牌", count: 1 },
  { userName: "小头OoO", giftName: "小心心", count: 1 },
  { userName: "蒜泥头", giftName: "粉丝团灯牌", count: 1 },
  { userName: "🌈畅意🌈⭐", giftName: "粉丝团灯牌", count: 1 }
];

// 计算控制条是否应该显示
const shouldShowControls = computed(() => {
  return controlsVisible.value || !isPlaying.value;
});

// 清晰度选项
const resolutionOptions = [
  { label: t("components.videoPlayer.resolution.2k"), key: "2k" },
  { label: t("components.videoPlayer.resolution.1080p"), key: "1080p" },
  { label: t("components.videoPlayer.resolution.720p"), key: "720p" },
  { label: t("components.videoPlayer.resolution.540p"), key: "540p" },
  { label: t("components.videoPlayer.resolution.auto"), key: "auto" }
];

// 动画帧ID存储
let animationFrameIds: number[] = [];

// 动画元素存储
let animationElements: HTMLElement[] = [];

// 聊天相关状态
const chatCollapsed = ref(false);
const audienceCount = ref(1492);

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
    level: "12",
    avatar: "https://picsum.photos/id/1001/100/100",
    isVip: true
  },
  {
    id: 2,
    name: "卡厄司岚那",
    level: "7",
    avatar: "https://picsum.photos/id/1002/100/100"
  },
  {
    id: 3,
    name: "吾爱有三",
    level: "34",
    avatar: "https://picsum.photos/id/1003/100/100"
  },
  {
    id: 4,
    name: "吾爱有三",
    level: "34",
    avatar: "https://picsum.photos/id/1003/100/100"
  },
  {
    id: 5,
    name: "吾爱有三",
    level: "34",
    avatar: "https://picsum.photos/id/1003/100/100"
  },
  {
    id: 6,
    name: "吾爱有三",
    level: "34",
    avatar: "https://picsum.photos/id/1003/100/100"
  },
  {
    id: 7,
    name: "吾爱有三",
    level: "34",
    avatar: "https://picsum.photos/id/1003/100/100"
  },
  {
    id: 8,
    name: "吾爱有三",
    level: "34",
    avatar: "https://picsum.photos/id/1003/100/100"
  }
]);

// 聊天消息模拟数据
const chatMessages = ref([
  {
    user: "眼里有✨星星✨河",
    level: "16",
    avatar: "https://picsum.photos/id/1004/100/100",
    content: "管理在吗"
  },
  {
    type: "gift",
    user: "冷漠傲世沅少",
    giftIcon: "图片URL",
    giftCount: 1,
    avatar: "https://picsum.photos/id/1004/100/100"
  },
  {
    type: "system",
    user: "Yennie",
    level: 19,
    avatar: "https://picsum.photos/id/1004/100/100",
    isVip: true,
    content: "刚刚升级至Lv.19"
  },
  {
    type: "system",
    user: "大德",
    level: 31,
    avatar: "https://picsum.photos/id/1004/100/100",
    content: "成为No.12本场1000贡献用户"
  },
  {
    type: "gift",
    user: "大德",
    giftName: "小心心",
    giftIcon: "https://picsum.photos/id/1008/10/10",
    giftCount: 15
  },
  {
    user: "AAA废品回收章哥",
    avatar: "https://picsum.photos/id/1005/100/100",
    content: "不接这种队友"
  },
  {
    user: "无尽星空",
    level: "9",
    avatar: "https://picsum.photos/id/1006/100/100",
    content: "乐子别介绍自己"
  },
  {
    user: "沐桑",
    level: "5",
    avatar: "https://picsum.photos/id/1007/100/100",
    content: "多少分了"
  },
  {
    user: "干啥呢",
    level: "7",
    avatar: "https://picsum.photos/id/1008/100/100",
    content: "你看这边是在自我介绍"
  },
  {
    user: "念旧",
    level: "7",
    avatar: "https://picsum.photos/id/1009/100/100",
    content: "那不是对面菜吗"
  },
  {
    user: "干啥呢",
    level: "7",
    avatar: "https://picsum.photos/id/1008/100/100",
    content: "信誉分不够，过来叫了"
  },
  {
    user: "蠢人偶",
    level: "3",
    avatar: "https://picsum.photos/id/1010/100/100",
    content: "中单太乙，边路东皇，游戏里遇到十有八九都是坑"
  },
  {
    user: "1001",
    level: "4",
    avatar: "https://picsum.photos/id/1011/100/100",
    content: "主播什么手机呀？"
  },
  {
    user: "JayChou",
    level: "12",
    avatar: "https://picsum.photos/id/1012/100/100",
    content: "演员还叫起来了😂"
  },
  {
    user: "Te滾世ぇ哆清",
    level: "14",
    avatar: "https://picsum.photos/id/1013/100/100",
    content: "来了"
  }
]);

// 计算剩余未显示的礼物列表
const remainingGifts = computed(() => {
  return gifts.slice(visibleGiftCount.value - 1);
});

// 打开举报弹窗的方法
const openReportDialog = () => {
  showReportDialog.value = true;
};

// 点赞直播间
const likeLive = () => {
  console.log("点赞直播间");
};

// 4. 处理举报提交的方法
const handleLiveReport = (roomId: number | string, type: string, description: string) => {
  console.log(`举报房间: ${roomId}, 类型: ${type}, 描述: ${description}`);
  // 这里可以调用后端的 API 接口提交举报数据
  // api.submitReport({...})

  window.$message?.success("举报已提交，感谢您共建清朗直播环境！");
  showReportDialog.value = false; // 关闭弹窗
};

/** 显示弹幕设置面板 */
const showDanmakuSettings = () => {
  showDanmakuSettingsPanel.value = true;
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
    danmakuSettingsHideTimer = null;
  }
};

/** 隐藏弹幕设置面板 */
const hideDanmakuSettings = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  danmakuSettingsHideTimer = window.setTimeout(() => {
    showDanmakuSettingsPanel.value = false;
    danmakuSettingsHideTimer = null;
  }, 100);
};

const handleSettingsPanelEnter = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
    danmakuSettingsHideTimer = null;
  }
};

const handleSettingsPanelLeave = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  danmakuSettingsHideTimer = window.setTimeout(() => {
    showDanmakuSettingsPanel.value = false;
    danmakuSettingsHideTimer = null;
  }, 100);
};

// 切换更多礼物弹窗
const toggleMoreGifts = () => {
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
  { diamonds: 10, price: 1 },
  { diamonds: 60, price: 6 },
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
  const giftListWidth = width;
  const minGiftWidth = 80;
  let count = Math.floor(giftListWidth / minGiftWidth);
  count = Math.max(count, 2);
  visibleGiftCount.value = count;
};

// 返回上一页
const handleBack = () => {
  router.back();
};

// 处理充值按钮点击
const handleRechargeClick = () => {
  moreGiftsVisible.value = false;
  rechargeVisible.value = !rechargeVisible.value;
};

// 关闭充值弹窗
const closeRecharge = () => {
  rechargeVisible.value = false;
};

// 计算当前的人民币应付金额 (扫码支付展示)
const payPrice = computed(() => {
  if (isCustomSelected.value) {
    return confirmedCustomPrice.value;
  }
  return rechargeOptions.find((opt) => opt.diamonds === selectedAmount.value)?.price || 0;
});

const selectFixedAmount = (diamonds: number) => {
  selectedAmount.value = diamonds;
  isCustomSelected.value = false;
};

const openCustomInput = () => {
  customAmountInputVisible.value = true;
};

const handleCustomAmountConfirm = (val: number) => {
  confirmedCustomPrice.value = val;
  selectedAmount.value = val * 10; // 假设 1元 = 10钻石
  isCustomSelected.value = true;
};

// 处理充值提交
const handleRechargeSubmit = () => {
  console.log(`充值 ${selectedAmount.value} 钻石`);
  closeRecharge();
};

// 赠送礼物带数量
const sendGiftWithAmount = (gift: any, amount: number) => {
  console.log(`赠送礼物：${gift.name} x ${amount}`);
  createGiftAnimation(gift, amount);
  popoverVisible.value[gift.id] = false;
};

// 创建礼物动画
const createGiftAnimation = (gift: any, amount: number) => {
  const container = document.querySelector(".gift-animation-container");
  if (!container) return;

  const animationEl = document.createElement("div");
  animationEl.className = "gift-animation-item absolute";
  animationEl.innerHTML = `
    <div class="gift-animation-content flex-y-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
      <div class="gift-icon w-6 h-6 rounded-full bg-white/10 flex-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <path d="${gift.path}"/>
        </svg>
      </div>
      <span class="gift-name text-white text-sm">${gift.name} x ${amount}</span>
    </div>
  `;

  animationEl.style.bottom = "10%";
  animationEl.style.left = "50px";
  animationEl.style.transform = "translateY(100%)";
  animationEl.style.opacity = "0";
  animationEl.style.transition = "none";

  container.appendChild(animationEl);
  animationElements.push(animationEl);

  const startAnimation = () => {
    animationEl.style.transition = "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1)";
    animationEl.style.transform = "translateY(-50px)";
    animationEl.style.opacity = "1";
  };

  const animationId1 = requestAnimationFrame(() => {
    requestAnimationFrame(startAnimation);
  });
  animationFrameIds.push(animationId1);

  const removeAnimation = () => {
    animationEl.style.transition = "all 0.5s ease-out";
    animationEl.style.transform = "translateY(-100px)";
    animationEl.style.opacity = "0";

    const animationId2 = requestAnimationFrame(() => {
      setTimeout(() => {
        if (animationEl.parentNode) {
          animationEl.parentNode.removeChild(animationEl);
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

// const handleSendMessage = (content: string) => {
//   chatMessages.value.push({
//     user: currentUser.name,
//     level: currentUser.level,
//     avatar: "https://picsum.photos/id/1025/100/100",
//     content: content
//   });
// };

// 视频控制逻辑
const togglePlay = () => {
  if (videoRef.value) {
    if (isPlaying.value) {
      videoRef.value.pause();
    } else {
      videoRef.value.play();
    }
  }
};

const refreshVideo = () => {
  if (flvPlayer) {
    flvPlayer.unload();
    flvPlayer.load();
    flvPlayer.play();
    isPlaying.value = true;
  }
};

const toggleScreenRotation = () => {
  isScreenRotated.value = !isScreenRotated.value;

  if (videoRef.value) {
    // 开启 CSS 过渡，使旋转动画更平滑
    videoRef.value.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    if (isScreenRotated.value) {
      const parent = videoRef.value.parentElement;
      let scale = 1;
      // 旋转90度后，视频的视觉宽度变成了原高度，视觉高度变成了原宽度。
      // 在宽屏(横屏)布局下，直接旋转会导致视频的顶部和底部超出容器范围。
      // 这里的逻辑：通过计算 容器高度 / 容器宽度 得到缩放比，使其等比缩放并完美居中(Contain)适应当前播放器区域。
      if (parent && parent.clientWidth > 0) {
        scale = parent.clientHeight / parent.clientWidth;
      }
      // 逆时针旋转 90 度并应用缩放（如果是顺时针需求，可以改成 rotate(90deg)）
      videoRef.value.style.transform = `rotate(-90deg) scale(${scale})`;
    } else {
      // 恢复到初始未旋转的状态
      videoRef.value.style.transform = "rotate(0deg) scale(1)";
    }
  }
};

/** 显示礼物设置面板 */
const showGiftSettings = () => {
  showGiftSettingsPanel.value = true;
  if (giftSettingsHideTimer) {
    clearTimeout(giftSettingsHideTimer);
    giftSettingsHideTimer = null;
  }
};

/** 隐藏礼物设置面板 */
const hideGiftSettings = () => {
  if (giftSettingsHideTimer) {
    clearTimeout(giftSettingsHideTimer);
  }
  giftSettingsHideTimer = window.setTimeout(() => {
    showGiftSettingsPanel.value = false;
    giftSettingsHideTimer = null;
  }, 100);
};

/** 处理礼物设置面板进入事件 */
const handleGiftSettingsPanelEnter = () => {
  if (giftSettingsHideTimer) {
    clearTimeout(giftSettingsHideTimer);
    giftSettingsHideTimer = null;
  }
};

/** 处理礼物设置面板离开事件 */
const handleGiftSettingsPanelLeave = () => {
  if (giftSettingsHideTimer) {
    clearTimeout(giftSettingsHideTimer);
  }
  giftSettingsHideTimer = window.setTimeout(() => {
    showGiftSettingsPanel.value = false;
    giftSettingsHideTimer = null;
  }, 100);
};

const toggleMiniWindow = async () => {
  if (!videoRef.value) return;

  try {
    if (document.pictureInPictureElement) {
      // 已经在小窗模式，则退出
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      // 检查视频是否已经加载了元数据 (readyState >= 1 代表 HAVE_METADATA)
      if (videoRef.value.readyState >= 1) {
        await videoRef.value.requestPictureInPicture();
      } else {
        window.$message?.warning("视频加载中，请稍后再试");
      }
    } else {
      console.warn("当前环境不支持画中画(小窗)功能");
    }
  } catch (error) {
    console.error("切换小窗模式失败:", error);
  }
};

// 全屏逻辑
const toggleFullscreen = async () => {
  const nextState = !isFullscreen.value;
  await appWindow.setFullscreen(nextState);
  isFullscreen.value = nextState;
};

// 切换清晰度
const switchResolution = (key: string) => {
  currentResolution.value = key === "auto" ? "自动" : key.toUpperCase();
  console.log("Switch resolution to:", key);
};

// 音量逻辑
const setVolume = (newVolume: number) => {
  volume.value = newVolume;
  if (videoRef.value) {
    videoRef.value.volume = newVolume / 100;
  }
};

// 切换静音/取消静音逻辑
const toggleMute = () => {
  if (volume.value > 0) {
    // 当前有声音，先保存当前音量，然后设置为 0 (静音)
    previousVolume.value = volume.value;
    setVolume(0);
  } else {
    // 当前为静音，恢复之前的音量（防范边界情况，如果之前也是 0，则默认恢复到 50）
    const restoreVolume = previousVolume.value > 0 ? previousVolume.value : 50;
    setVolume(restoreVolume);
  }
};

// 滚轮控制音量逻辑
const handleVolumeWheel = (event: WheelEvent) => {
  // 定义每次滚动的音量变化步长
  const step = 5;
  // event.deltaY < 0 表示向上滚动(增大音量)，> 0 表示向下滚动(减小音量)
  let newVolume = volume.value + (event.deltaY < 0 ? step : -step);
  // 将音量限制在 0 - 100 的范围内
  newVolume = Math.max(0, Math.min(100, newVolume));
  // 调用现有的 setVolume 方法更新音量和播放器状态
  setVolume(newVolume);
};

// 复制直播间链接逻辑
const copyRoomLink = async () => {
  try {
    // TODO
    window.$message?.success("链接复制成功");
  } catch (err) {
    console.error("复制失败:", err);
    window.$message?.error("复制失败，请重试");
  }
};

onMounted(() => {
  // 使用 mpegts 初始化 FLV 播放
  if (mpegts.getFeatureList().mseLivePlayback && videoRef.value) {
    flvPlayer = mpegts.createPlayer({
      type: "flv",
      isLive: true,
      url: "http://localhost:8000/live/room1.flv" // 你的 FLV 拉流地址
    });

    flvPlayer.attachMediaElement(videoRef.value);
    flvPlayer.load();
    const playPromise = flvPlayer.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying.value = true;
        })
        .catch((err: any) => {
          console.error("Auto play failed", err);
          isPlaying.value = false;
        });
    } else {
      // 如果返回 void，说明是旧版逻辑，通常直接视为播放成功
      isPlaying.value = true;
    }

    // 监听错误
    flvPlayer.on(mpegts.Events.ERROR, (type, details) => {
      console.log("flv error", type, details);
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
    const customModal = document.querySelector(".custom-amount-modal");
    if (
      rechargeVisible.value &&
      rechargePopup &&
      !rechargePopup.contains(event.target as Node) &&
      rechargeBtn &&
      !rechargeBtn.contains(event.target as Node) &&
      !(customModal && customModal.contains(event.target as Node))
    ) {
      closeRecharge();
    }
  };

  document.addEventListener("click", handleClickOutside);

  // 初始化全屏状态
  appWindow.isFullscreen().then((state) => {
    isFullscreen.value = state;
  });

  // 监听窗口大小变化（用于捕获用户按 ESC 键或通过系统快捷键退出全屏的情况）
  appWindow
    .onResized(async () => {
      isFullscreen.value = await appWindow.isFullscreen();
    })
    .then((unlisten) => {
      unlistenResize = unlisten;
    });

  // 清理事件监听
  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  // 开启模拟 WebSocket 接收弹幕 (每 600ms 随机飘一条)
  mockWsInterval = window.setInterval(() => {
    if (danmakuPlayerRef.value && isPlaying.value) {
      // 设定 40% 的概率刷出礼物弹幕，60% 刷普通弹幕
      const isGift = Math.random() < 0.4;

      if (isGift) {
        // 随机抽取一个礼物数据
        const randomGift = mockGiftData[Math.floor(Math.random() * mockGiftData.length)];

        // 触发礼物弹幕
        danmakuPlayerRef.value.addDanmaku(
          "", // 礼物弹幕的主文本留空
          false, // isMe
          Date.now() + Math.random(), // 随机ID
          false, // isLiked
          "scroll", // 位置类型
          randomGift // 传入我们刚刚在子组件里新增的 giftData 结构
        );
      } else {
        // 触发普通文本弹幕
        const randomText = mockDanmakuData[Math.floor(Math.random() * mockDanmakuData.length)];
        danmakuPlayerRef.value.addDanmaku(randomText);
      }
    }
  }, 600);
});

onUnmounted(() => {
  if (danmakuSettingsHideTimer) clearTimeout(danmakuSettingsHideTimer);
  if (giftSettingsHideTimer) clearTimeout(giftSettingsHideTimer);
  // 销毁播放器
  if (flvPlayer) {
    flvPlayer.destroy();
    flvPlayer = null;
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

  // 清理 Tauri 窗口事件监听
  if (unlistenResize) {
    unlistenResize();
  }
  // 清理模拟 WebSocket 定时器
  if (mockWsInterval) clearInterval(mockWsInterval);
});
</script>

<style scoped lang="scss">
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

/* --- 弹幕设置面板样式 --- */
.danmaku-settings-panel {
  position: absolute;
  /* 让面板悬浮在设置按钮正上方 */
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 260px;
  background-color: var(--bg-popover, rgba(20, 20, 20, 0.95));
  backdrop-filter: blur(10px);
  border: 1px solid var(--line-color, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideUp 0.2s ease;
  cursor: default; /* 防止内部点击出现手型 */
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  border-bottom: 1px solid var(--line-color, rgba(255, 255, 255, 0.1));
}

.settings-title {
  color: var(--text-color, #fff);
  font-size: 13px;
  font-weight: 600;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--user-text-color, rgba(255, 255, 255, 0.7));
  font-size: 12px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background-color: var(--bg-left-menu-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-color, #fff);
}

.settings-content {
  padding: 12px 15px;
}

.settings-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.settings-item:last-child {
  margin-bottom: 0;
}

.settings-label {
  color: var(--text-color, #fff);
  font-size: 12px;
  min-width: 60px;
  flex-shrink: 0;
}

.settings-value-right {
  color: var(--user-text-color, rgba(255, 255, 255, 0.7));
  font-size: 12px;
  min-width: 45px;
  text-align: right;
  flex-shrink: 0;
}

.settings-arrow {
  margin-left: auto;
}

.settings-divider {
  height: 1px;
  background-color: var(--line-color, rgba(255, 255, 255, 0.1));
  margin: 12px 0;
}

.position-options {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.position-btn {
  padding: 3px 10px;
  font-size: 11px;
  color: var(--user-text-color, rgba(255, 255, 255, 0.7));
  border: 1px solid var(--line-color, rgba(255, 255, 255, 0.2));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.position-btn:hover {
  border-color: #ff0050;
  color: #ff0050;
}

.position-btn.active {
  background-color: #ff0050;
  border-color: #ff0050;
  color: #fff;
}

/* --- 弹幕设置与礼物设置面板通用样式 --- */
.danmaku-settings-panel,
.gift-settings-panel {
  position: absolute;
  /* 让面板悬浮在设置按钮正上方 */
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 220px; /* 礼物面板没那么多文字，稍微窄一点点看起来更精致 */
  background-color: var(--bg-popover, rgba(20, 20, 20, 0.95));
  backdrop-filter: blur(10px);
  border: 1px solid var(--line-color, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideUp 0.2s ease;
  cursor: default; /* 防止内部点击出现手型 */
}

/* 覆盖宽度的特殊情况，如果是弹幕面板则保持原宽 */
.danmaku-settings-panel {
  width: 260px;
}
</style>
