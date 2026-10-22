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
