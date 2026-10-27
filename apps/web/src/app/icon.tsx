import { readFile } from "node:fs/promises";
import path from "node:path";
import { ADMIN_MEDIA_BASE, mediaIconUrl } from "@resume/contracts";
import { monogram } from "@resume/modules";
import { ImageResponse } from "next/og";
import { readContentSourceConfig } from "@/lib/content/config";
import { getPublicPage } from "@/lib/content/get-page";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** --rs-color-primary, --rs-color-primary-foreground */
const PRIMARY = "#2F6BFF";
const ON_PRIMARY = "#FFFFFF";

/** 첫 글자(한글 포함)를 그릴 글꼴. 배포 출력에 포함되도록 next.config의 outputFileTracingIncludes에도 적는다. */
const ICON_FONT = "node_modules/pretendard/dist/public/static/alternative/Pretendard-Bold.ttf";
let font: Promise<Buffer> | undefined;
function loadFont() {
  font ??= readFile(path.join(process.cwd(), ICON_FONT));
  return font;
}

/** 로고를 어드민이 만든 정사각형 PNG(data URL)로 받는다. 실패하면 null. */
async function loadLogo(assetId: string): Promise<string | null> {
  const config = readContentSourceConfig();
  if (config.mode !== "api") return null;
  try {
    const res = await fetch(`${config.baseUrl}${mediaIconUrl(ADMIN_MEDIA_BASE, assetId)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!res.ok) return null;
    return `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch (error) {
    console.error(`[icon] 로고 ${assetId} 요청 실패`, error);
    return null;
  }
}

/**
 * 파비콘: 머리글과 같은 규칙. 로고 이미지가 있으면 로고, 없으면 이름 첫 글자.
 * 머리글에서 로고를 숨겨도 탭 아이콘은 비워 두지 않고 첫 글자를 쓴다.
 */
export default async function Icon() {
  const result = await getPublicPage("home");
  const site = result.ok ? result.response.data.site : null;
  const name = result.ok ? result.response.data.content.profile.name : "";

  const image = site?.logo?.image;
  if (image) {
    const logo = await loadLogo(image.assetId);
    if (logo) {
      return new ImageResponse(
        // biome-ignore lint/performance/noImgElement: 아이콘 이미지 생성(satori)에는 img만 쓸 수 있다
        <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />,
        size,
      );
    }
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: PRIMARY,
        color: ON_PRIMARY,
        fontFamily: "Pretendard",
        fontSize: 18,
        fontWeight: 700,
      }}
    >
      {monogram(name)}
    </div>,
    { ...size, fonts: [{ name: "Pretendard", data: await loadFont(), weight: 700 }] },
  );
}
