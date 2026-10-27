import type { Project, ProjectIconKey, ProjectTone } from "@resume/contracts";
import { sampleContent } from "@resume/contracts/samples";
import { ProjectIcon, projectIconLabel, projectToneLabel } from "@resume/modules";
import type { Meta, StoryObj } from "@storybook/react-vite";

const first = sampleContent.projects[0];
if (!first) throw new Error("샘플 프로젝트가 없습니다");
const base: Project = first;
const iconKeys = Object.keys(projectIconLabel) as ProjectIconKey[];
const toneKeys = Object.keys(projectToneLabel) as ProjectTone[];

/** 어드민에서 고를 수 있는 프로젝트 아이콘과 색. 모든 색은 흰 아이콘과 4.5:1 이상이다. */
function IconGallery() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-bold">아이콘 ({iconKeys.length})</h2>
        <ul className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {iconKeys.map((icon) => (
            <li key={icon} className="flex flex-col items-center gap-1.5">
              <ProjectIcon project={{ ...base, icon }} />
              <span className="text-caption text-muted-foreground">{projectIconLabel[icon]}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-bold">색 ({toneKeys.length})</h2>
        <ul className="grid grid-cols-4 gap-4 sm:grid-cols-7">
          {toneKeys.map((tone) => (
            <li key={tone} className="flex flex-col items-center gap-1.5">
              <ProjectIcon project={{ ...base, tone }} />
              <span className="text-caption text-muted-foreground">{projectToneLabel[tone]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const meta = {
  title: "Modules/Project Icons",
  component: IconGallery,
  parameters: { layout: "padded" },
} satisfies Meta<typeof IconGallery>;
export default meta;

export const Gallery: Story = { name: "아이콘과 색" };
type Story = StoryObj<typeof meta>;
