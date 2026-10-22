import type { RenderOptions } from "@resume/modules";
import Link from "next/link";

/** 공개 사이트의 모듈 렌더링 옵션: 내부 링크는 next/link로 이동한다. */
export const siteRenderOptions: RenderOptions = { Link };
