import { Button } from "@resume/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@resume/ui/components/empty";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Construction, TriangleAlert } from "lucide-react";

const meta = { title: "UI/Empty" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const NotReady: Story = {
  name: "빈 상태",
  render: () => (
    <Empty className="max-w-lg rounded-xl bg-card shadow-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>아직 준비 중인 페이지입니다</EmptyTitle>
        <EmptyDescription>
          회사별 경험 목록과 상세 페이지가 이곳에 들어갈 예정입니다.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">홈으로 돌아가기</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const ErrorState: Story = {
  name: "오류 상태",
  render: () => (
    <Empty className="max-w-lg rounded-xl border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive-soft text-destructive">
          <TriangleAlert aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>콘텐츠 서버에 연결할 수 없습니다</EmptyTitle>
        <EmptyDescription>잠시 후 다시 시도해 주세요.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
