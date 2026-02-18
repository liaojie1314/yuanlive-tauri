export type BlockType = "text" | "image" | "thinking" | "video" | "audio" | "file";

export interface VideoBlock extends BaseBlock {
  type: "video";
  url: string;
  coverImg?: string;
}

export interface AudioBlock extends BaseBlock {
  type: "audio";
  url: string;
}

export interface BaseBlock {
  type: BlockType;
  id: string;
}

export interface ThinkingBlock extends BaseBlock {
  type: "thinking";
  content: string;
  duration: number;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
}

export interface FileBlock extends BaseBlock {
  type: "file";
  url: string; // 文件路径
  name: string; // 文件名
}

export type ContentBlock = ThinkingBlock | TextBlock | ImageBlock | VideoBlock | AudioBlock | FileBlock;

// 原始消息数据 (后端 API 返回的数据结构)
export interface MessageData {
  id: number | string;
  // 核心字段：用 role 来判断是谁发的
  role: "user" | "assistant" | "system";
  sender?: string;
  avatar?: string;
  time?: string;
  // 内容可能是字符串，也可能是数组，适配器会处理它
  content: string | any;
  // 可选：思考相关字段 (DeepSeek R1 等模型)
  thinking?: string;
  thinkingTime?: number;
  // 用于多版本切换的字段
  currentVersion?: number; // 当前版本号 (如 1)
  versionCount?: number; // 总版本数 (如 2)
}
