import { Button } from "@resume/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@resume/ui/components/sheet";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

const meta = { title: "UI/Sheet" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = ["홈", "개인 프로젝트", "회사 경험", "히스토리"];

/** 오른쪽 슬라이드 패널. Escape로 닫으면 트리거로 포커스가 돌아갑니다. */
export const RightPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-lg" aria-label="메뉴 열기">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)]">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>메뉴</SheetTitle>
          <SheetDescription className="sr-only">사이트의 페이지로 이동합니다.</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-1 px-3">
          {items.map((item) => (
            <li key={item}>
              <a
                href="#sheet"
                className="flex min-h-12 items-center rounded-md px-3 font-semibold hover:bg-accent"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "메뉴 열기" });
    await userEvent.click(trigger);
    await expect(within(document.body).getByRole("dialog", { name: "메뉴" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
