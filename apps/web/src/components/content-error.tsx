import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@resume/ui/components/empty";
import { TriangleAlert } from "lucide-react";
import type { PageResult } from "@/lib/content/get-page";
import { PageContainer } from "./page-shell";

type ErrorResult = Extract<PageResult, { ok: false }>;

const titles: Record<ErrorResult["error"]["kind"], string> = {
  config: "콘텐츠 설정이 올바르지 않습니다",
  network: "콘텐츠 서버에 연결할 수 없습니다",
  timeout: "콘텐츠 서버 응답이 늦습니다",
  http: "콘텐츠를 불러오지 못했습니다",
  "invalid-response": "콘텐츠 형식이 올바르지 않습니다",
  "not-found": "페이지를 찾을 수 없습니다",
};

/**
 * 콘텐츠를 불러오지 못했을 때의 화면. 샘플 데이터로 대체하지 않는다.
 * 세부 메시지는 운영자가 원인을 찾을 수 있도록 표시하되 비밀 정보는 담지 않는다.
 */
export function ContentError({ result }: { result: ErrorResult }) {
  return (
    <PageContainer>
      <main id="main" className="flex flex-1 items-center py-16">
        <Empty className="rounded-xl border border-border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive-soft text-destructive">
              <TriangleAlert aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              <h1 className="text-title font-bold">{titles[result.error.kind]}</h1>
            </EmptyTitle>
            <EmptyDescription>
              잠시 후 다시 시도해 주세요. 문제가 계속되면 사이트 운영자에게 알려 주세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p
              role="status"
              data-error-kind={result.error.kind}
              className="text-caption text-subtle-foreground"
            >
              {result.error.message}
            </p>
          </EmptyContent>
        </Empty>
      </main>
    </PageContainer>
  );
}
