declare module "glfx" {
  export interface Texture {
    loadContentsOf(element: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): void;
    destroy(): void;
  }

  export interface FxCanvas extends HTMLCanvasElement {
    texture(element: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Texture;
    draw(texture: Texture): FxCanvas;
    update(): void;

    // --- 基础美颜 ---
    denoise(exponent: number): FxCanvas;
    unsharpMask(radius: number, strength: number): FxCanvas;
    brightnessContrast(brightness: number, contrast: number): FxCanvas;
    hueSaturation(hue: number, saturation: number): FxCanvas;

    // 暗角: size (0-1), amount (0-1)
    vignette(size: number, amount: number): FxCanvas;
    // 哈哈镜: centerX, centerY, radius, strength (-1 to 1)
    bulgePinch(centerX: number, centerY: number, radius: number, strength: number): FxCanvas;
    // 蜂巢马赛克: centerX, centerY, scale
    hexagonalPixelate(centerX: number, centerY: number, scale: number): FxCanvas;
    // 水墨风格: strength (0-1)
    ink(strength: number): FxCanvas;
    // 噪点: amount (0-1)
    noise(amount: number): FxCanvas;
    // 复古褐色: amount (0-1)
    sepia(amount: number): FxCanvas;
  }

  export function canvas(): FxCanvas;
}
