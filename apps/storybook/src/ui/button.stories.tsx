import { Button } from "@resume/ui/components/button";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUpRight, Plus } from "lucide-react";
import { expect } from "storybook/test";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "프로젝트 보기" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "link", "destructive"],
    },
    size: { control: "select", options: ["xs", "sm", "default", "lg"] },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>기본</Button>
      <Button variant="outline">외곽선</Button>
      <Button variant="secondary">보조</Button>
      <Button variant="ghost">고스트</Button>
      <Button variant="link">링크</Button>
      <Button variant="destructive">삭제</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">아주 작게</Button>
      <Button size="sm">작게</Button>
      <Button>기본</Button>
      <Button size="lg">
        크게 <ArrowUpRight aria-hidden="true" />
      </Button>
      <Button size="icon" variant="outline" aria-label="추가">
        <Plus aria-hidden="true" />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button disabled>게시</Button>
      <Button variant="outline" disabled>
        초안 저장
      </Button>
    </div>
  ),
};

/** 키보드 포커스 상태. play 함수가 버튼에 포커스를 줍니다. */
export const Focused: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button");
    button.focus();
    await expect(button).toHaveFocus();
  },
};
