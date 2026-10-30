import { readFile } from "node:fs/promises";
import path from "node:path";
import { monogram } from "@resume/modules";
import { ImageResponse } from "next/og";

/*
 * 공유 미리보기(Open Graph) 이미지. 링크를 메신저·SNS에 붙였을 때 보이는 1200×630 카드.
 * 홈은 프로필의 대표 문구를, 상세 페이지는 제목과 한 줄 설명을 그린다.
 * 글꼴 파일은 실행 중에 읽으므로 next.config의 outputFileTracingIncludes에도 적어 둔다.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** --rs-color-* 토큰과 같은 값. satori는 CSS 변수를 읽지 못해 값을 직접 쓴다. */
const COLORS = {
  background: "#1C1D21",
  foreground: "#FFFFFF",
  muted: "#A3A6AD",
  primary: "#2D66F7",
  onPrimary: "#FFFFFF",
};

const FONT_DIR = "node_modules/pretendard/dist/public/static/alternative";
let fonts: Promise<[Buffer, Buffer]> | undefined;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(path.join(process.cwd(), FONT_DIR, "Pretendard-Bold.ttf")),
    readFile(path.join(process.cwd(), FONT_DIR, "Pretendard-Regular.ttf")),
  ]);
  return fonts;
}

export interface OgCardProps {
  /** 제목 위의 작은 라벨 (직무, "개인 프로젝트" 등) */
  eyebrow?: string | undefined;
  /** 줄바꿈(\n)을 그대로 살린다 */
  title: string;
  description?: string | undefined;
  /** 아래 왼쪽의 이름. 첫 글자를 동그라미에 그린다. */
  name: string;
  /** 아래 오른쪽의 사이트 주소나 제목 */
  footer?: string | undefined;
}

export async function ogImageResponse(props: OgCardProps) {
  const [bold, regular] = await loadFonts();
  const longTitle = props.title.length > 28;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: COLORS.background,
        color: COLORS.foreground,
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {props.eyebrow ? (
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              color: COLORS.primary,
              textTransform: "uppercase",
            }}
          >
            {props.eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontSize: longTitle ? 56 : 72,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -1,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
            maxHeight: 280,
          }}
        >
          {props.title}
        </div>
        {props.description ? (
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.45,
              color: COLORS.muted,
              overflow: "hidden",
              maxHeight: 90,
            }}
          >
            {props.description}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: COLORS.primary,
              color: COLORS.onPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {monogram(props.name)}
          </div>
          <div style={{ fontWeight: 700 }}>{props.name}</div>
        </div>
        {props.footer ? <div style={{ color: COLORS.muted }}>{props.footer}</div> : null}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700 },
        { name: "Pretendard", data: regular, weight: 400 },
      ],
    },
  );
}
