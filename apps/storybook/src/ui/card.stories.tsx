import { Button } from "@resume/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@resume/ui/components/card";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Card" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>초안</CardTitle>
        <CardDescription>마지막 게시 이후 변경 사항이 없습니다.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            보기
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-body-sm text-muted-foreground">
        공통 UI의 Card는 어드민 등 일반 화면에 씁니다. 포트폴리오 카드는 모듈 렌더러가 따로
        그립니다.
      </CardContent>
      <CardFooter>
        <Button size="sm">계속</Button>
      </CardFooter>
    </Card>
  ),
};
