import JSEncrypt from "jsencrypt";

/**
 * RSA 加密函数
 * @param data 需要加密的明文数据 (注意：RSA 单次加密的数据长度受秘钥长度限制，通常不能超过 117 或 245 字节)
 * @param publicKey 后端提供的 RSA 公钥 (Base64 格式，通常包含 BEGIN PUBLIC KEY 头尾)
 * @returns 加密后的 Base64 密文字符串。如果加密失败，抛出异常。
 */
export function encryptRSA(data: string, publicKey: string): string {
  if (!data) return "";
  if (!publicKey) throw new Error("RSA 公钥不能为空");

  try {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(publicKey);

    // encrypt 方法执行成功返回 string，失败返回 false
    const encrypted = encryptor.encrypt(data);
    if (!encrypted) {
      throw new Error("加密返回 false");
    }
    return encrypted;
  } catch (error) {
    console.error("RSA 加密失败:", error);
    throw new Error("数据加密失败，请检查公钥格式");
  }
}

/**
 * RSA 解密函数
 * 因为私钥绝对不能暴露在前端代码中。
 * @param encryptedData 需要解密的 Base64 密文
 * @param privateKey RSA 私钥
 * @returns 解密后的明文字符串。
 */
export function decryptRSA(encryptedData: string, privateKey: string): string {
  if (!encryptedData) return "";
  if (!privateKey) throw new Error("RSA 私钥不能为空");

  try {
    const decryptor = new JSEncrypt();
    decryptor.setPrivateKey(privateKey);

    // decrypt 方法执行成功返回 string，失败返回 false
    const decrypted = decryptor.decrypt(encryptedData);
    if (!decrypted) {
      throw new Error("解密返回 false");
    }
    return decrypted;
  } catch (error) {
    console.error("RSA 解密失败:", error);
    throw new Error("数据解密失败，请检查私钥格式或密文");
  }
}

export default {
  encrypt: encryptRSA,
  decrypt: decryptRSA
};
