import type { Block } from "@resume/contracts";
import { BlockContent } from "@resume/modules";
import type { Meta, StoryObj } from "@storybook/react-vite";

const blocks: Block[] = [
  { id: "h2", type: "heading", level: 2, text: [{ text: "문제" }] },
  {
    id: "p1",
    type: "paragraph",
    text: [
      { text: "근무 시간을 " },
      { text: "직접 계산", marks: ["bold"] },
      { text: "하는 일이 번거로웠습니다. " },
      { text: "참고 자료", href: "https://example.com", marks: ["italic"] },
    ],
  },
  {
    id: "list",
    type: "bulleted-list",
    items: [
      {
        text: [{ text: "기록" }],
        children: [
          { text: [{ text: "출근·퇴근" }], children: [{ text: [{ text: "자동 알림" }] }] },
          { text: [{ text: "휴게 시간" }] },
        ],
      },
      { text: [{ text: "주간 합계 " }, { text: "API", marks: ["code"] }] },
    ],
  },
  { id: "q", type: "quote", text: [{ text: "작게 시작해서 꾸준히 개선한다." }] },
  { id: "c1", type: "callout", tone: "info", text: [{ text: "샘플 본문입니다." }] },
  { id: "c2", type: "callout", tone: "warning", text: [{ text: "주의가 필요한 안내입니다." }] },
  { id: "d", type: "divider" },
  { id: "h3", type: "heading", level: 3, text: [{ text: "결과" }] },
];

/** 프로젝트·회사 상세 본문 렌더러. 어드민의 블록 편집기가 저장한 형식을 그린다. */
const meta = {
  title: "Modules/Block Content",
  component: BlockContent,
  args: { blocks },
  decorators: [
    (Story) => (
      <div className="max-w-2xl rounded-xl bg-card p-8 shadow-card">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BlockContent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllBlocks: Story = { name: "모든 블록" };
export const Empty: Story = { name: "빈 본문", args: { blocks: [] } };
