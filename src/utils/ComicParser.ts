import * as cheerio from "cheerio";
import { invoke } from "@tauri-apps/api/core";

import { TauriCommandEnum } from "@/enums";

export interface Chapter {
  name: string;
  url?: string; // 这一章的网页完整链接 (在线漫画特有)
  pages: string[]; // 这一章的图片列表
}

export interface ComicBook {
  title?: string;
  cover: string;
  chapters: Chapter[];
}

export interface ComicItem {
  title: string;
  cover: string;
  url: string; // 漫画的详情页链接
  author: string;
  tags: string[]; // 例如
}

/**
 * 解析包子漫画的列表页 (书城/分类/发现页)
 * @param url 列表页 URL (例如: https://www.bzmgcn.com/classify)
 */
export const parseBaoziList = async (url: string): Promise<ComicItem[]> => {
  try {
    console.log(`正在请求列表页: ${url}`);
    const htmlText: string = await invoke(TauriCommandEnum.FETCH_HTML_SOURCE, { url });
    const $ = cheerio.load(htmlText);
    const comicList: ComicItem[] = [];
    // 遍历每一个漫画卡片节点
    $(".comics-card").each((_, el) => {
      const posterNode = $(el).find("a.comics-card__poster");
      const infoNode = $(el).find("a.comics-card__info");
      // 提取详情页链接
      let comicUrl = posterNode.attr("href") || "";
      if (comicUrl.startsWith("/")) {
        comicUrl = "https://www.bzmgcn.com" + comicUrl;
      }
      // 提取标题
      const title = infoNode.find("h3").text().trim();
      // 提取封面 (取第一个 amp-img 的 src)
      const cover = posterNode.find("amp-img").first().attr("src") || "";
      // 提取作者
      const author = infoNode.find("small.tags").text().trim();
      // 提取标签
      const tags: string[] = [];
      posterNode.find(".tab").each((_, tabEl) => {
        tags.push($(tabEl).text().trim());
      });
      // 只要有标题和链接，就认为是有效数据
      if (title && comicUrl) {
        comicList.push({ title, cover, url: comicUrl, author, tags });
      }
    });
    return comicList;
  } catch (error) {
    console.error("解析漫画列表失败:", error);
    throw error;
  }
};

/**
 * 解析包子漫画详情页 (获取漫画封面及章节目录)
 * @param url 漫画详情页 URL (例如: https://www.bzmgcn.com/comic/xxx)
 */
export const parseBaoziComic = async (url: string): Promise<ComicBook> => {
  try {
    const htmlText: string = await invoke(TauriCommandEnum.FETCH_HTML_SOURCE, { url });
    const $ = cheerio.load(htmlText);
    // 提取标题
    const title = $("h1.comics-detail__title").text().trim() || "unknown comic";
    // 提取封面 (优先使用 meta 标签)
    const cover = $('meta[name="og:image"]').attr("content") || $('meta[property="og:image"]').attr("content") || "";
    // 提取章节列表
    const chapters: Chapter[] = [];
    // 包子漫画的章节分成了两部分：#chapter-items 和 #chapters_other_list
    $("#chapter-items a.comics-chapters__item, #chapters_other_list a.comics-chapters__item").each((_, el) => {
      const chapterName = $(el).find("span").text().trim();
      let chapterUrl = $(el).attr("href");
      if (chapterName && chapterUrl) {
        // 处理相对路径
        if (chapterUrl.startsWith("/")) {
          chapterUrl = "https://www.bzmgcn.com" + chapterUrl;
        }
        chapters.push({
          name: chapterName,
          url: chapterUrl,
          pages: [] // 图片列表初始为空，等用户点击阅读时动态抓取
        });
      }
    });

    return {
      title,
      cover,
      chapters
    };
  } catch (error) {
    console.error("解析包子漫画详情失败:", error);
    throw error;
  }
};

/**
 * 解析包子漫画某一章的具体图片 URL 数组 (支持自动翻页抓取完整章节)
 * @param chapterUrl 这一话的第一页链接
 */
export const parseBaoziChapterImages = async (chapterUrl: string): Promise<string[]> => {
  let currentUrl = chapterUrl;
  const allImages: string[] = [];
  const domain = new URL(chapterUrl).origin;
  const visitedUrls = new Set<string>();

  try {
    // 只要还有“下一页”，就继续循环抓取
    while (currentUrl) {
      // 抹除 URL 中的 hash (如 #bottom)，防止同一页面被判定为不同 URL
      const cleanUrl = currentUrl.split("#")[0];

      // 如果这个 URL 已经抓取过了，说明遇到了循环，立刻强制跳出！
      if (visitedUrls.has(cleanUrl)) {
        console.warn("⚠️ 检测到死循环，已强制跳出:", cleanUrl);
        break;
      }
      visitedUrls.add(cleanUrl);

      console.log(`正在解析章节页面: ${cleanUrl}`);

      const htmlText: string = await invoke(TauriCommandEnum.FETCH_HTML_SOURCE, { url: cleanUrl });
      const $ = cheerio.load(htmlText);

      // 提取当前页面的所有图片
      $("amp-img.comic-contain__item").each((_, el) => {
        const src = $(el).attr("data-src") || $(el).attr("src");
        if (src) {
          allImages.push(src);
        }
      });
      let nextHref = "";
      $(".next_chapter a").each((_, el) => {
        const text = $(el).text().trim();
        // 必须确切包含“下一頁”，且不能是“上一頁”
        if (text.includes("下一頁")) {
          nextHref = $(el).attr("href") || "";
        }
      });
      if (nextHref) {
        currentUrl = nextHref.startsWith("http") ? nextHref : domain + nextHref;
      } else {
        // 本章结束
        currentUrl = "";
      }
    }
    return allImages;
  } catch (error) {
    console.error("解析章节图片失败:", error);
    throw error;
  }
};
