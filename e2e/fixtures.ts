import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// 테스트용 이미지 생성·검사 전용 (sharp는 루트 개발 의존성)

const dir = path.resolve("test-results/smoke-media");

/** 위치 정보(GPS)와 세로 회전 정보가 들어간 3000×2000 JPEG */
export async function gpsPhoto(): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "gps.jpg");
  await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 47, g: 107, b: 255 } },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExifMerge({
      IFD0: { Make: "SmokePhone" },
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: "37/1 33/1 0/1",
        GPSLongitudeRef: "E",
        GPSLongitude: "126/1 58/1 0/1",
      },
    })
    .toFile(file);
  return file;
}

export async function imageInfo(bytes: Buffer) {
  const meta = await sharp(bytes).metadata();
  return {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    exif: Boolean(meta.exif),
    xmp: Boolean(meta.xmp),
  };
}

/** 로고로 쓸 가로로 긴 빨간 PNG (머리글·파비콘 확인용) */
export async function redLogo(): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "logo.png");
  await sharp({
    create: { width: 240, height: 80, channels: 4, background: { r: 230, g: 30, b: 30, alpha: 1 } },
  })
    .png()
    .toFile(file);
  return file;
}

/** PNG 한가운데 픽셀의 색 */
export async function centerPixel(bytes: Buffer) {
  const { data, info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  const i = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
  return { r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0 };
}
