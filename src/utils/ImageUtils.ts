/**
 * 图片处理工具类
 */

/**
 * 将 Tauri 的 RGBA 图片数据转换为 PNG 格式的 File 对象
 * @param imageData RGBA 字节数组
 * @param width 图片宽度
 * @param height 图片高度
 * @param filename 文件名（可选）
 */
export const rgbaToFile = async (
  imageData: Uint8Array,
  width: number,
  height: number,
  filename: string = `image-${Date.now()}.png`
): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建 Canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 Canvas 上下文"));
        return;
      }
      // 创建 ImageData 对象
      const canvasImageData = ctx.createImageData(width, height);
      // 处理不同的数据源格式
      let uint8Array: Uint8Array;
      if (imageData.buffer instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);
      } else {
        uint8Array = new Uint8Array(imageData);
      }
      // 复制数据到 canvas ImageData
      canvasImageData.data.set(uint8Array);
      // 将 ImageData 绘制到 canvas
      ctx.putImageData(canvasImageData, 0, 0);
      // 将 canvas 转换为 Blob，然后创建 File 对象
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas 转换为 Blob 失败"));
            return;
          }
          const file = new File([blob], filename, { type: "image/png" });
          resolve(file);
        },
        "image/png",
        1
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 将 Tauri 的 RGBA 图片数据转换为 PNG 格式的 Uint8Array
 * @param imageData RGBA 字节数组
 * @param width 图片宽度
 * @param height 图片高度
 */
export const rgbaToUint8Array = async (imageData: Uint8Array, width: number, height: number): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建 Canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 Canvas 上下文"));
        return;
      }
      // 创建 ImageData 对象
      const canvasImageData = ctx.createImageData(width, height);
      // 处理不同的数据源格式
      let uint8Array: Uint8Array;
      if (imageData.buffer instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);
      } else {
        uint8Array = new Uint8Array(imageData);
      }
      // 复制数据到 canvas ImageData
      canvasImageData.data.set(uint8Array);
      // 将 ImageData 绘制到 canvas
      ctx.putImageData(canvasImageData, 0, 0);
      // 将 canvas 转换为 Blob，然后读取为 Uint8Array
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas 转换为 Blob 失败"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.onerror = () => {
            reject(new Error("读取图片数据失败"));
          };
          reader.readAsArrayBuffer(blob);
        },
        "image/png",
        1
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 处理剪贴板图片数据
 * 简化版本，专门用于处理 Tauri 剪贴板读取的图片数据
 * @param clipboardImage Tauri 剪贴板图片对象
 */
export const processClipboardImage = async (clipboardImage: any): Promise<File> => {
  // 获取图片的宽度和高度
  const { width, height } = await clipboardImage.size();
  // 获取图片的 RGBA 数据
  const imageData = await clipboardImage.rgba();
  // 使用 rgbaToFile 函数转换为 File 对象
  return await rgbaToFile(imageData, width, height);
};
