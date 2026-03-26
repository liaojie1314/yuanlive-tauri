import {
  formatBottomText,
  getFileSuffix,
  extractFileName,
  formatBytes,
  formatSecondsToTimeStr,
  formatTimeStrToSeconds,
  formatNumber
} from "./FormattingUtils";

describe("FormattingUtils 工具函数集合测试", () => {
  describe("getFileSuffix - 获取文件 Icon 映射", () => {
    it("常规后缀应正确映射", () => {
      expect(getFileSuffix("document.pdf")).toBe("pdf");
      expect(getFileSuffix("style.css")).toBe("css");
    });

    it("多个后缀名混合的视频文件应统一映射为 mp4", () => {
      expect(getFileSuffix("video.avi")).toBe("mp4");
      expect(getFileSuffix("movie.rmvb")).toBe("mp4");
      expect(getFileSuffix("clip.mkv")).toBe("mp4");
    });

    it("带多个点的文件名应正确提取最后一个后缀", () => {
      expect(getFileSuffix("archive.tar.zip")).toBe("zip");
    });

    it("大写后缀应被统一转换为小写处理", () => {
      expect(getFileSuffix("IMAGE.PSD")).toBe("psd");
    });

    it('未收录的后缀或异常输入应返回 "other"', () => {
      expect(getFileSuffix("unknown.xyz")).toBe("other");
      expect(getFileSuffix("no_suffix_file")).toBe("other");
      expect(getFileSuffix("")).toBe("other");
    });
  });

  describe("extractFileName - 提取文件名", () => {
    it("应正确处理 Unix/Linux/Mac 路径", () => {
      expect(extractFileName("/var/log/system/error.log")).toBe("error.log");
    });

    it("应正确处理 Windows 路径", () => {
      expect(extractFileName("C:\\Windows\\System32\\cmd.exe")).toBe("cmd.exe");
    });

    it("应正确处理混合路径", () => {
      expect(extractFileName("folder/subfolder\\file.txt")).toBe("file.txt");
    });

    it("只有文件名时应原样返回", () => {
      expect(extractFileName("just_file.md")).toBe("just_file.md");
    });

    it('极端边界：以斜杠结尾的路径会触发 fallback 逻辑返回 "file"', () => {
      expect(extractFileName("folder/")).toBe("file");
    });
  });

  describe("formatBytes - 文件大小格式化", () => {
    it('小于等于 0 或 NaN 应返回 "0 B"', () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(-1024)).toBe("0 B");
      expect(formatBytes(NaN)).toBe("0 B");
    });

    it("应正确转换为对应单位", () => {
      expect(formatBytes(500)).toBe("500 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024 * 1.5)).toBe("1.5 MB");
      expect(formatBytes(1024 * 1024 * 1024 * 2.34)).toBe("2.34 GB");
    });
  });

  describe("formatBottomText - 底部文本截断", () => {
    it("当文本长度小于等于最大长度时，应原样返回", () => {
      expect(formatBottomText("abcde", 6)).toBe("abcde");
    });

    it("当包含中文时，不论长度多长都应原样返回", () => {
      expect(formatBottomText("这是一个非常长的中文字符串", 6)).toBe("这是一个非常长的中文字符串");
    });

    it("当纯英文超过最大长度时，应截断并追加省略号", () => {
      expect(formatBottomText("LongTextString", 6)).toBe("LongTe...");
    });

    it("截断时应跳过空格，只计算实际有效字符", () => {
      expect(formatBottomText("a b c d e f g", 6)).toBe("a b c d e f...");
    });

    it("应支持自定义最大长度和省略号参数", () => {
      expect(formatBottomText("HelloWorld", 5, "***")).toBe("Hello***");
    });
  });

  describe("formatSecondsToTimeStr - 格式化时间为字符串", () => {
    it("正常秒数转换为 mm:ss", () => {
      expect(formatSecondsToTimeStr(45)).toBe("00:45");
      expect(formatSecondsToTimeStr(125)).toBe("02:05");
      expect(formatSecondsToTimeStr(600)).toBe("10:00");
    });

    it("包含小数的秒数应向下取整", () => {
      expect(formatSecondsToTimeStr(65.9)).toBe("01:05");
    });

    it("异常输入（NaN, Infinity）应返回默认值 00:00", () => {
      expect(formatSecondsToTimeStr(NaN)).toBe("00:00");
      expect(formatSecondsToTimeStr(Infinity)).toBe("00:00");
    });
  });

  describe("formatTimeStrToSeconds - 字符串转秒数", () => {
    it("正常的 mm:ss 字符串应正确转换为秒", () => {
      expect(formatTimeStrToSeconds("00:45")).toBe(45);
      expect(formatTimeStrToSeconds("02:05")).toBe(125);
      expect(formatTimeStrToSeconds("10:00")).toBe(600);
    });

    it("格式错误或包含非数字的字符串应返回 -1", () => {
      expect(formatTimeStrToSeconds("12345")).toBe(-1); // 没有冒号
      expect(formatTimeStrToSeconds("aa:bb")).toBe(-1); // 非数字
      expect(formatTimeStrToSeconds("12:34:56")).toBe(-1); // 超过两段
    });
  });

  describe("formatNumber - 数字格式化", () => {
    it("小于 10000 的数字原样输出字符串", () => {
      expect(formatNumber(9999)).toBe("9999");
      expect(formatNumber(0)).toBe("0");
    });

    it("大于等于 10000 的数字转为 万 单位并保留一位小数", () => {
      expect(formatNumber(10000)).toBe("1.0万");
      expect(formatNumber(15400)).toBe("1.5万");
      expect(formatNumber(200000)).toBe("20.0万");
    });
  });
});
