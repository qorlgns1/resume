import type { ReactNode } from "react";
import { ModuleLink } from "../module-link";
import type { RenderOptions } from "../types";

/** 상위 목록으로 돌아가는 링크 */
export function BackLink({
  label,
  href,
  options,
}: {
  label: string;
  href: string;
  options: RenderOptions;
}) {
  return (
    <ModuleLink
      href={href}
      options={options}
      className="w-fit text-body-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      ← {label}
    </ModuleLink>
  );
}

/** 목록·상세 페이지의 제목 영역 */
export function PageHeader({
  title,
  description,
  back,
  options,
  children,
}: {
  title: string;
  description?: string | undefined;
  back?: { label: string; href: string };
  options: RenderOptions;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3">
      {back ? <BackLink label={back.label} href={back.href} options={options} /> : null}
      <h1 className="text-display-sm font-extrabold tracking-tight">{title}</h1>
      {description ? <p className="text-body-lg text-muted-foreground">{description}</p> : null}
      {children}
    </header>
  );
}

/** 목록이 비었을 때 */
export function EmptyList({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-card px-6 py-10 text-center text-body text-muted-foreground shadow-card">
      {children}
    </p>
  );
}
