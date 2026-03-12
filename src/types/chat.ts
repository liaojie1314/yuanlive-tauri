export type BlockType = "text" | "image" | "thinking" | "video" | "audio" | "file";

export interface BaseBlock {
  type: BlockType;
  id: string;
}
export interface VideoBlock extends BaseBlock {
  type: "video";
  url: string;
  coverImg?: string;
}

export interface AudioBlock extends BaseBlock {
  type: "audio";
  url: string;
}

export interface ThinkingBlock extends BaseBlock {
  type: "thinking";
  content: string;
  duration: number;
  toolCalls?: ToolCallDetail[];
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

export interface Citation {
  id: number; // 引用序号，如 1, 2, 3
  title: string; // 来源名称，如 "adv.txt"
  type: "file" | "web" | "history"; // 来源类型，用于展示不同的图标
  snippet: string; // 向量库中匹配到的具体文本片段 (Chunk)
  score?: number; // 相似度得分 (可选，用于展示相关性)
}

export interface ToolCallDetail {
  id: string;
  name: string;
  args: any; // 工具参数
  status: "pending" | "executing" | "success" | "error"; // pending状态代表正在等待用户授权
  result?: string; // 执行完毕后的结果
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
  citations?: Citation[]; // 引用来源列表
  toolCalls?: ToolCallDetail[];
}
