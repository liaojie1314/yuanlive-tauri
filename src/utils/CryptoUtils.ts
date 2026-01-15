import CryptoJS from "crypto-js";

// 从环境变量获取密钥和偏移量
const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET_KEY; // 密钥 16位
const SECRET_IV = import.meta.env.VITE_CRYPTO_SECRET_IV; // 偏移量 16位

// 将密钥和偏移量转换为 WordArray
const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);

/**
 * AES 加密函数 (CBC模式, Pkcs7填充)
 * @param data 需要加密的数据，可以是字符串或对象
 * @returns 加密后的字符串，Base64格式
 */
export function encrypt(data: string | object): string {
  if (!data) {
    return "";
  }
  try {
    // 如果数据是对象，转换为JSON字符串
    const dataStr = typeof data === "object" ? JSON.stringify(data) : String(data);
    const encrypted = CryptoJS.AES.encrypt(dataStr, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // 返回Base64格式的加密字符串
    return encrypted.toString();
  } catch (error) {
    console.error("加密失败:", error);
    throw new Error("数据加密失败");
  }
}

/**
 * AES 解密函数
 * @param encryptedData 加密后的字符串，Base64格式
 * @returns 解密后的原始数据，可以是字符串或对象
 */
export function decrypt(encryptedData: string): string | object {
  if (!encryptedData) {
    return "";
  }
  try {
    const decryptResult = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // 将解密结果转换为UTF-8字符串
    const decryptedStr = decryptResult.toString(CryptoJS.enc.Utf8);
    // 尝试解析为JSON（如果是加密对象）
    try {
      return JSON.parse(decryptedStr);
    } catch (_e) {
      // 如果不是JSON字符串，直接返回
      return decryptedStr;
    }
  } catch (error) {
    console.error("解密失败:", error);
    throw new Error("数据解密失败");
  }
}

export default {
  encrypt,
  decrypt
};
