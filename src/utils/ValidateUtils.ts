/**
 * 检查是否允许输入空格
 * @param value 输入值
 * @returns 是否允许输入空格
 */
export const noSideSpace = (value: string) => !value.startsWith(" ") && !value.endsWith(" ");

/**
 * 检查密码是否满足最小长度要求
 * @param value 密码值
 * @returns 是否满足最小长度要求
 */
export const validateMinLength = (value: string) => value.length >= 6;

/**
 * 检查字符串是否包含特殊字符
 * @param value 要检查的字符串
 * @param patten 可选的正则表达式模式，默认包含常见特殊字符
 * @returns 如果字符串包含特殊字符则返回true，否则返回false
 */
export const validateSpecialChar = (value: string, patten = /[!@#¥$%.&*^()_+=\-~]/) => patten.test(value);

/**
 * 检查字符是否包含英文和数字
 * @param value 要检查的字符串
 * @returns 如果字符串包含英文和数字则返回true，否则返回false
 */
export const validateAlphaNumeric = (value: string) => {
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  return hasLetter && hasNumber;
};
