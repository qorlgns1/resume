import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import type { RenderOptions } from "./types";

interface ModuleLinkProps {
  href: string;
  options: RenderOptions;
  className?: string;
  children: ReactNode;
  /** 링크 뒤에 방향 아이콘 표시 */
  withIcon?: boolean;
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

/**
 * 모듈 안의 모든 링크가 거치는 컴포넌트.
 * 내부 경로는 주입된 Link, 외부 링크는 새 탭, 미리보기(inert)에서는 이동하지 않는 텍스트로 렌더링한다.
 */
export function ModuleLink({
  href,
  options,
  className,
  children,
  withIcon = false,
}: ModuleLinkProps) {
  const Icon = href.startsWith("#") ? ArrowDown : ArrowUpRight;
  const body = (
    <>
      {children}
      {withIcon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
    </>
  );

  if (options.inert) {
    return <span className={className}>{body}</span>;
  }
  if (isExternal(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {body}
        <span className="sr-only"> (새 탭에서 열림)</span>
      </a>
    );
  }
  if (href.startsWith("/") && options.Link) {
    const RouterLink = options.Link;
    return (
      <RouterLink href={href} className={className}>
        {body}
      </RouterLink>
    );
  }
  return (
    <a href={href} className={className}>
      {body}
    </a>
  );
}
