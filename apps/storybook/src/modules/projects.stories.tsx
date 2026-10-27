import type { ContentLibrary, ModuleInstance } from "@resume/contracts";
import { sampleContent } from "@resume/contracts/samples";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SingleModule, sampleModule } from "./helpers";

const grid = sampleModule("mod_home_projects");

function withProjects(count: 1 | 2 | 3): ModuleInstance {
  if (grid.type !== "projects" || grid.props.variant !== "grid")
    throw new Error("grid 모듈이 아닙니다");
  return { ...grid, props: { ...grid.props, projectIds: grid.props.projectIds.slice(0, count) } };
}

/** 첫 프로젝트에 링크 두 개를 단 콘텐츠. 카드는 링크를 두 개까지 보여준다. */
const contentWithLinks: ContentLibrary = {
  ...sampleContent,
  projects: sampleContent.projects.map((project, index) =>
    index === 0
      ? {
          ...project,
          links: [
            { id: "link_store", label: "App Store", href: "https://apps.apple.com" },
            { id: "link_github", label: "GitHub", href: "https://github.com" },
          ],
        }
      : project,
  ),
};

/** 홈에 표시하는 개인 프로젝트는 1~3개다. 개수에 따라 카드 배치가 바뀐다. */
const meta = {
  title: "Modules/Projects Grid",
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

export const ThreeProjects: Story = { name: "3개", args: { module: withProjects(3) } };
export const TwoProjects: Story = { name: "2개", args: { module: withProjects(2) } };
export const OneProject: Story = { name: "1개", args: { module: withProjects(1) } };
export const WithLinks: Story = {
  name: "링크 있는 카드",
  args: { module: withProjects(3), content: contentWithLinks },
};
