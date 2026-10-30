import type { ContentLibrary } from "@resume/contracts";
import { BlockContent } from "../block-content";
import { keepNode, type RenderOptions, type WrapContent } from "../types";
import { EmptyList } from "./page-header";

/** 소개 페이지 본문: 프로필의 소개 본문을 그대로 보여준다. */
export function AboutView({
  content,
  options,
  wrapItem = keepNode,
}: {
  content: ContentLibrary;
  options: RenderOptions;
  wrapItem?: WrapContent;
}) {
  const { about, name } = content.profile;
  return wrapItem(
    { section: "profile", label: `${name} 소개 본문` },
    about.length > 0 ? (
      <article className="rounded-xl bg-card p-6 shadow-card lg:p-8">
        <BlockContent blocks={about} options={options} className="max-w-3xl" />
      </article>
    ) : (
      <EmptyList>아직 작성한 소개가 없습니다.</EmptyList>
    ),
  );
}
