import { Button } from "@resume/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@resume/ui/components/tooltip";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Tooltip" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">미리보기</Button>
      </TooltipTrigger>
      <TooltipContent>공개 사이트와 같은 렌더러로 그립니다</TooltipContent>
    </Tooltip>
  ),
};

/**
 * 아직 구현하지 않은 버튼. disabled 대신 aria-disabled를 써서 키보드 포커스와 툴팁 안내를 유지한다.
 * (어드민의 NotReadyButton과 같은 패턴)
 */
export const NotReadyButton: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button
          aria-disabled="true"
          className="cursor-not-allowed opacity-50"
          onClick={(e) => e.preventDefault()}
        >
          게시
          <span className="sr-only">(게시는 준비 중입니다)</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>게시는 준비 중입니다</TooltipContent>
    </Tooltip>
  ),
};
