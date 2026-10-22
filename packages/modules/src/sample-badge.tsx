import { Badge } from "@resume/ui/components/badge";

/** 샘플 콘텐츠 표시. 실제 경력·성과로 오인되지 않도록 카드마다 붙인다. */
export function SampleBadge({ show }: { show: boolean | undefined }) {
  if (!show) return null;
  return (
    <Badge variant="outline" className="rs-line rs-fg-subtle rounded-sm bg-transparent">
      샘플
    </Badge>
  );
}
