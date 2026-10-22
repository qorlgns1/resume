import { Button } from "@resume/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@resume/ui/components/dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

const meta = { title: "UI/Dialog" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">모듈 삭제</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>모듈을 삭제할까요?</DialogTitle>
          <DialogDescription>
            초안에서만 삭제됩니다. 게시하기 전까지 공개 사이트에는 반영되지 않습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button variant="destructive">삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "모듈 삭제" }));
    const dialog = within(document.body).getByRole("dialog");
    await expect(dialog).toBeVisible();
  },
};
