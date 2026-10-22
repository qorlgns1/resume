import { sampleContent } from "@resume/contracts/samples";
import {
  CompanyDetailView,
  CompanyListView,
  HistoryTimelineView,
  ProjectDetailView,
  ProjectListView,
} from "@resume/modules";
import type { Meta, StoryObj } from "@storybook/react-vite";

/** 개인 프로젝트·회사 경험·히스토리 페이지 본문. 공개 사이트와 어드민 미리보기가 함께 쓴다. */
const meta = {
  title: "Modules/Pages",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[80rem] px-4 py-6 lg:px-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// biome-ignore lint/style/noNonNullAssertion: 샘플에는 항상 프로젝트와 회사가 있다
const project = sampleContent.projects[0]!;
// biome-ignore lint/style/noNonNullAssertion: 샘플 회사 C에는 본문과 성과가 있다
const company = sampleContent.companies.find((c) => c.id === "co_c")!;

export const ProjectList: Story = {
  name: "개인 프로젝트 목록",
  render: () => <ProjectListView content={sampleContent} options={{}} />,
};
export const ProjectListEmpty: Story = {
  name: "개인 프로젝트 목록 · 비어 있음",
  render: () => <ProjectListView content={{ ...sampleContent, projects: [] }} options={{}} />,
};
export const ProjectDetail: Story = {
  name: "프로젝트 상세",
  render: () => <ProjectDetailView project={project} options={{}} />,
};
export const CompanyList: Story = {
  name: "회사 경험 목록",
  render: () => <CompanyListView content={sampleContent} options={{}} />,
};
export const CompanyDetail: Story = {
  name: "회사 경험 상세",
  render: () => <CompanyDetailView company={company} content={sampleContent} />,
};
export const History: Story = {
  name: "히스토리",
  render: () => <HistoryTimelineView content={sampleContent} options={{}} />,
};
export const HistoryMobile: Story = {
  name: "히스토리 · 모바일",
  globals: { viewport: { value: "mobile390" } },
  render: () => <HistoryTimelineView content={sampleContent} options={{}} />,
};
