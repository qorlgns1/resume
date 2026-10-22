import { sampleContent, sampleHomePage } from "@resume/contracts/samples";
import { BentoGrid } from "@resume/modules";
import type { Meta, StoryObj } from "@storybook/react-vite";

/** 샘플 홈 전체. 공개 사이트와 같은 BentoGrid 렌더러를 사용한다. */
const meta = {
  title: "Modules/Home Page",
  component: BentoGrid,
  args: { page: sampleHomePage, content: sampleContent },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[80rem] px-4 py-6 lg:px-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BentoGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: { viewport: { value: "desktop1440" } } };
export const Mobile: Story = { globals: { viewport: { value: "mobile390" } } };
