import { Tabs, TabsContent, TabsList, TabsTrigger } from "@resume/ui/components/tabs";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Tabs" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="content" className="max-w-sm">
      <TabsList className="w-full">
        <TabsTrigger value="content">콘텐츠</TabsTrigger>
        <TabsTrigger value="style">스타일</TabsTrigger>
        <TabsTrigger value="layout">배치</TabsTrigger>
        <TabsTrigger value="history" disabled>
          기록
        </TabsTrigger>
      </TabsList>
      <TabsContent value="content" className="pt-3 text-body-sm">
        모듈의 문구와 연결된 콘텐츠를 편집합니다.
      </TabsContent>
      <TabsContent value="style" className="pt-3 text-body-sm">
        배경, 글자 크기, 정렬, 여백, 테두리를 고릅니다.
      </TabsContent>
      <TabsContent value="layout" className="pt-3 text-body-sm">
        데스크톱 12칼럼과 모바일 배치를 조정합니다.
      </TabsContent>
    </Tabs>
  ),
};
