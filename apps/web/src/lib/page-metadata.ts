import type { Metadata } from "next";

/*
 * 페이지별 메타데이터. 제목·설명을 Open Graph에도 그대로 넣는다.
 * Next는 하위 페이지의 openGraph 객체로 상위 값을 통째로 바꾸므로, 페이지마다 여기서 전부 만든다.
 * 미리보기 이미지는 app/**\/opengraph-image.tsx가 자동으로 붙이고, 절대 주소는 layout의 metadataBase가 채운다.
 */
export function pageMetadata(input: {
  title: string;
  /** 탭 제목에 사이트 제목을 덧붙이지 않을 때 (홈) */
  absoluteTitle?: boolean;
  description?: string | undefined;
  /** 공개 사이트 기준 경로. 정식 주소(canonical)와 og:url에 쓴다. */
  path: string;
  siteName: string;
}): Metadata {
  const { title, description, path, siteName } = input;
  return {
    title: input.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName,
      url: path,
      title,
      description,
    },
  };
}
