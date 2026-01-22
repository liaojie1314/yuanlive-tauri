import { useI18n } from "vue-i18n";

function isSameCalendarWeek(date1: Date, date2: Date): boolean {
  const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay(); // 0 星期日 1 星期一 ... 6 星期六
    // 如果是周日，减去6就回调到上周一
    // 否则减去1，就回调到本周一
    const diff = start.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(start.setDate(diff));
  };

  const getStartOfWeek1 = getStartOfWeek(date1);
  const getStartOfWeek2 = getStartOfWeek(date2);

  return getStartOfWeek1.toDateString() === getStartOfWeek2.toDateString();
}

function formatTimeOnly(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getWeekDay(date: Date, t: any): string {
  const weekDays = [
    t("hook.time.weekday.sun"),
    t("hook.time.weekday.mon"),
    t("hook.time.weekday.tue"),
    t("hook.time.weekday.wed"),
    t("hook.time.weekday.thu"),
    t("hook.time.weekday.fri"),
    t("hook.time.weekday.sat")
  ];
  return weekDays[date.getDay()];
}

function formatMonthDay(date: Date, locale: string): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (locale === "en") {
    return `${month}/${day}`;
  }
  return `${month}月${day}日`;
}

function formatFullDateTime(date: Date, locale: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (locale === "en") {
    // 英文格式 MM/DD/YYYY HH:mm
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  }
  // 中文格式 YYYY年MM月DD日 HH:mm
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function formatTimeAgoCore(targetDate: Date, nowDate: Date, t: any, locale: string): string {
  const diff = nowDate.getTime() - targetDate.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  const isSameDay = targetDate.toDateString() === nowDate.toDateString();
  const isSameWeek = isSameCalendarWeek(targetDate, nowDate);
  const isSameYear = targetDate.getFullYear() === nowDate.getFullYear();
  // 一小时以内
  if (hours < 1) {
    if (minutes < 5) {
      return t("hook.time.justNow");
    }
    return t("hook.time.minutes", { count: minutes });
  }
  // 一小时到一天以内 (同一天)
  else if (isSameDay) {
    return formatTimeOnly(targetDate);
  }
  // 一天以上 一周以内 (同一周)
  else if (!isSameDay && isSameWeek) {
    return `${getWeekDay(targetDate, t)} ${formatTimeOnly(targetDate)}`;
  }
  // 一周以上 一个年以内 (同一年)
  else if (!isSameDay && !isSameWeek && isSameYear) {
    return `${formatMonthDay(targetDate, locale)} ${formatTimeOnly(targetDate)}`;
  }
  // 一个年以上
  return formatFullDateTime(targetDate, locale);
}

export function useBatchTimeAgo() {
  const { t, locale } = useI18n();
  const now = ref(new Date());
  const timer = ref<number | null>(null);
  const updateInterval = 1000 * 60;

  const setupTimer = () => {
    if (!timer.value) {
      timer.value = window.setInterval(() => {
        now.value = new Date();
      }, updateInterval);
    }
  };

  const clearTimer = () => {
    if (timer.value) {
      window.clearInterval(timer.value);
      timer.value = null;
    }
  };

  const formatTimeAgo = (timestamp: number | Date): string => {
    const targetDate = timestamp instanceof Date ? timestamp : new Date(timestamp);

    return formatTimeAgoCore(targetDate, now.value, t, locale.value);
  };

  setupTimer();
  onUnmounted(() => {
    clearTimer();
  });

  return {
    formatTimeAgo,
    clearTimer
  };
}
