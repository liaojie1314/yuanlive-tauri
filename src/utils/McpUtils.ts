export const nativeFsTools: McpTool[] = [
  {
    name: "fs_read_file_lines",
    description: "按行号局部读取文本文件。当文件过大时，请使用此工具分页读取。强烈建议每次读取 100-500 行进行分析。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件的绝对路径" },
        start_line: { type: "integer", description: "开始读取的行号（从 1 开始）" },
        end_line: { type: "integer", description: "结束读取的行号" }
      },
      required: ["path", "start_line", "end_line"]
    }
  },
  {
    name: "fs_search_file",
    description:
      "在极大的文本文件（如巨型日志）中搜索特定的关键词，返回包含该关键词的行号和具体内容。这是排查错误的最快方式。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件的绝对路径" },
        keyword: { type: "string", description: "要搜索的关键词（如 'Exception', 'Error' 或某个特定的变量名）" }
      },
      required: ["path", "keyword"]
    }
  },
  {
    name: "fs_read_file",
    description: "读取指定路径的文件内容。",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "文件的绝对路径" } },
      required: ["path"]
    }
  },
  {
    name: "fs_write_file",
    description: "将内容写入指定文件。如果文件已存在会被覆盖；如果目录不存在会自动创建。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件的绝对路径" },
        content: { type: "string", description: "要写入的纯文本内容" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "fs_list_dir",
    description: "获取指定目录下的所有文件和子文件夹列表。",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "目录的绝对路径" } },
      required: ["path"]
    }
  },
  {
    name: "fs_create_dir",
    description: "创建一个新的目录。支持递归创建（即连同不存在的父目录一起创建）。",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "新目录的绝对路径" } },
      required: ["path"]
    }
  },
  {
    name: "fs_move_file",
    description: "移动文件或重命名文件/目录。",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "原文件的绝对路径" },
        destination: { type: "string", description: "目标文件的绝对路径" }
      },
      required: ["source", "destination"]
    }
  },
  {
    name: "fs_get_file_info",
    description: "获取指定文件的信息（文件名、扩展名、MIME 类型、是否存在、存储路径）。",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "文件的绝对路径" } },
      required: ["path"]
    }
  }
];
