export interface Video {
  id: string;
  coverUrl: string;
  videoUrl: string;
  title: string;
  likes: number;
  duration?: number;
}

export const generateMockVideos = (page: number, size: number): Video[] => {
  const videos: Video[] = [];
  const startIndex = (page - 1) * size;

  const mockVideoUrls = [
    "https://player.vimeo.com/external/371569789.sd.mp4?s=290203140923190304911c7e7bc108d000a9200f&profile_id=165&oauth2_token_id=57447761",
    "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  ];

  for (let i = 0; i < size; i++) {
    const index = startIndex + i;
    videos.push({
      // 使用随机数防止不同 Tab 之间的 key 冲突
      id: `video-${Math.random().toString(36).substring(2, 9)}-${index}`,
      coverUrl: `https://picsum.photos/seed/${index}/400/225`,
      videoUrl: mockVideoUrls[i % mockVideoUrls.length],
      title: `这是一个测试视频标题 ${index + 1}，用于展示视频卡片`,
      likes: Math.floor(Math.random() * 100000),
      duration: Math.floor(Math.random() * 3600) + 60
    });
  }

  return videos;
};
