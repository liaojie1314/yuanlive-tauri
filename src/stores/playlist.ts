import { StoresEnum } from "@/enums";
import { VideoItem } from "@/api/types";
import { getVideoListByUidApi } from "@/api/follow";

export const usePlaylistStore = defineStore(StoresEnum.PLAYLIST, () => {
  const videoList = ref<VideoItem[]>([]);
  const currentVideoIndex = ref(0); // 当前播放到第几个了
  const currentPage = ref(1);
  const hasMore = ref(true);
  const isLoading = ref(false);
  const currentUserId = ref<number | null>(null);

  // 获取当前正在播放的视频对象
  const currentVideo = computed(() => videoList.value[currentVideoIndex.value] || null);

  /**
   * 获取视频数据（支持第一页和加载更多）
   * @param userId 要获取视频数据的用户ID
   * @param isLoadMore 是否加载更多数据（默认值为 false）
   */
  const fetchVideos = async (userId: number, isLoadMore = false) => {
    if (isLoading.value || (!hasMore.value && isLoadMore)) return;

    isLoading.value = true;
    currentUserId.value = userId;

    // 准备要请求的页码
    const targetPage = isLoadMore ? currentPage.value : 1;

    try {
      const res = await getVideoListByUidApi(userId, targetPage, 10);
      const newVideos = res.list || [];

      if (newVideos.length < 10) hasMore.value = false;

      if (isLoadMore) {
        // 加载更多：追加数据
        videoList.value.push(...newVideos);
        currentPage.value++;
      } else {
        videoList.value = newVideos;
        currentVideoIndex.value = 0; // 重置播放进度
        currentPage.value = 2; // 下一次准备请求第2页
        hasMore.value = newVideos.length >= 10;
      }
    } catch (error) {
      console.error("获取视频接口报错，使用模拟数据", error);
      if (!isLoadMore) {
        // 同样，报错后直接用模拟数据覆盖
        videoList.value = [
          {
            id: Date.now(),
            videoUrl: "http://vjs.zencdn.net/v/oceans.mp4",
            coverUrl: `https://picsum.photos/150/200?random=${userId}1`,
            likeCount: 2070,
            commentCount: 120,
            shareCount: 50,
            collectCount: 300,
            description: "111121312"
          },
          {
            id: Date.now() + 1,
            videoUrl: "http://vjs.zencdn.net/v/oceans.mp4",
            coverUrl: `https://picsum.photos/150/200?random=${userId}2`,
            likeCount: 8033,
            commentCount: 10,
            shareCount: 2,
            collectCount: 15,
            description: "111121312"
          }
        ];
        currentVideoIndex.value = 0;
        currentPage.value = 2;
        hasMore.value = false;
      }
    } finally {
      isLoading.value = false;
    }
  };

  /** 播放下一个视频 */
  const playNext = async () => {
    if (currentVideoIndex.value < videoList.value.length - 1) {
      currentVideoIndex.value++;
    }
    // 如果快播到底部了（比如倒数第2个），提前去预加载下一页
    if (currentVideoIndex.value >= videoList.value.length - 3 && hasMore.value) {
      await fetchVideos(currentUserId.value!, true);
    }
  };

  /**
   * 播放指定视频
   * @param video 要播放的视频对象
   */
  const playSpecificVideo = (video: VideoItem) => {
    const index = videoList.value.findIndex((v) => v.id === video.id);
    if (index !== -1) currentVideoIndex.value = index;
  };

  return {
    videoList,
    currentVideo,
    currentUserId,
    currentVideoIndex,
    hasMore,
    isLoading,
    fetchVideos,
    playNext,
    playSpecificVideo
  };
});
