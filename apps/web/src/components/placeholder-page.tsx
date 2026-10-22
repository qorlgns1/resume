import type { Page } from "@resume/contracts";
import { buttonVariants } from "@resume/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@resume/ui/components/empty";
import { Construction } from "lucide-react";
import Link from "next/link";

/** 아직 콘텐츠 구조가 확정되지 않은 기본 페이지의 빈 상태 */
export function PlaceholderPage({ page, planned }: { page: Page; planned: string }) {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-sm font-extrabold tracking-tight">{page.title}</h1>
        {page.description ? (
          <p className="text-body-lg text-muted-foreground">{page.description}</p>
        ) : null}
      </header>
      <Empty className="rounded-xl bg-card shadow-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>
            <h2 className="text-title font-bold">아직 준비 중인 페이지입니다</h2>
          </EmptyTitle>
          <EmptyDescription>{planned}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            홈으로 돌아가기
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
}
