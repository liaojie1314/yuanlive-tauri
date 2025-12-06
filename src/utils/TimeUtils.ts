import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";

export const setDayjsLocale = (lang: string) => {
  const mapped = lang.toLowerCase().includes("zh") ? "zh-cn" : "en";
  dayjs.locale(mapped);
};

dayjs.extend(relativeTime);
dayjs.extend(weekday);
setDayjsLocale("zh-CN");
