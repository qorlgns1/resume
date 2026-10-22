import type { ModuleInstance } from "@resume/contracts";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SingleModule, sampleModule } from "./helpers";

const meta = {
  title: "Modules/Cards",
  component: SingleModule,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[80rem] p-4 lg:p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SingleModule>;
export default meta;
type Story = StoryObj<typeof meta>;

export const IntroHero: Story = {
  name: "자기소개 · 대표",
  args: { module: sampleModule("mod_home_intro"), colSpan: 7 },
};
export const IntroPrinciples: Story = {
  name: "자기소개 · 일하는 방식",
  args: { module: sampleModule("mod_home_principles") },
};
export const ProjectSpotlight: Story = {
  name: "대표 프로젝트 · 강조",
  args: { module: sampleModule("mod_home_spotlight"), colSpan: 5 },
};
export const Achievements: Story = {
  name: "성과",
  args: { module: sampleModule("mod_home_achievements") },
};
export const TechStack: Story = {
  name: "기술 스택",
  args: { module: sampleModule("mod_home_stack"), colSpan: 4 },
};
export const Status: Story = {
  name: "현재 상태",
  args: { module: sampleModule("mod_home_status"), colSpan: 8 },
};
export const HistoryEntry: Story = {
  name: "히스토리 진입부",
  args: { module: sampleModule("mod_home_history") },
};

const intro = sampleModule("mod_home_intro");
/** 모듈 스타일 설정 예시: 가운데 정렬, 큰 글자, 옅은 강조색 배경, 테두리 */
export const StyleOverrides: Story = {
  name: "스타일 설정 예시",
  args: {
    module: {
      ...intro,
      style: {
        background: "primary-soft",
        textScale: "lg",
        align: "center",
        padding: "lg",
        border: "subtle",
      },
    } as ModuleInstance,
  },
};
