import { Badge } from "@resume/ui/components/badge";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Badge", component: Badge, args: { children: "운영 중" } } satisfies Meta<
  typeof Badge
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>기본</Badge>
      <Badge variant="soft">운영 중</Badge>
      <Badge variant="outline">개발 중</Badge>
      <Badge variant="secondary">보조</Badge>
      <Badge variant="success">게시됨</Badge>
      <Badge variant="warning">로컬 검토용</Badge>
      <Badge variant="destructive">오류</Badge>
    </div>
  ),
};
