import { Info } from "lucide-react";

/** 샘플 데이터로 렌더링 중임을 알린다. API 모드의 게시 데이터에는 표시하지 않는다. */
export function SampleNotice() {
  return (
    <p
      role="note"
      className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-body-sm text-muted-foreground"
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-text" />
      <span>샘플 데이터로 표시 중입니다. 인물·회사·프로젝트·수치는 실제 정보가 아닙니다.</span>
    </p>
  );
}
