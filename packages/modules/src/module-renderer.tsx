import type { ModuleType } from "@resume/contracts";
import type { ComponentType } from "react";
import { AchievementsModule } from "./renderers/achievements";
import { CredentialsModule } from "./renderers/credentials";
import { HistoryEntryModule } from "./renderers/history-entry";
import { IntroModule } from "./renderers/intro";
import { ProjectsModule } from "./renderers/projects";
import { StatusModule } from "./renderers/status";
import { TechStackModule } from "./renderers/tech-stack";
import type { ModuleRenderProps } from "./types";

/** 모듈 타입 → 렌더러. 새 모듈은 contracts의 스키마와 이 표에 함께 추가한다. */
const renderers: { [T in ModuleType]: ComponentType<ModuleRenderProps<T>> } = {
  intro: IntroModule,
  projects: ProjectsModule,
  achievements: AchievementsModule,
  "tech-stack": TechStackModule,
  status: StatusModule,
  "history-entry": HistoryEntryModule,
  credentials: CredentialsModule,
};

/** 모듈 내용만 렌더링한다. 카드 프레임은 ModuleFrame이 담당한다. */
export function ModuleContent(props: ModuleRenderProps) {
  const Renderer = renderers[props.module.type] as ComponentType<ModuleRenderProps>;
  return <Renderer {...props} />;
}
