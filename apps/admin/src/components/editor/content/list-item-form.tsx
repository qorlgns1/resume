"use client";

import type { Achievement, Company, Project, TechStackGroup } from "@resume/contracts";
import { Button } from "@resume/ui/components/button";
import { FieldGroup } from "@resume/ui/components/field";
import { Plus } from "lucide-react";
import { useEditor } from "../editor-context";
import { AchievementFields } from "./achievement-fields";
import { CompanyFields } from "./company-fields";
import {
  contentSectionLabels,
  createContentItem,
  findContentUsages,
  type ListSection,
} from "./content-model";
import { ProjectFields } from "./project-fields";
import { DeleteContentButton } from "./shared-fields";
import { TechStackFields } from "./tech-stack-fields";

/** 목록형 구역(프로젝트·회사·성과·기술 스택)의 한 항목. 고른 항목이 없으면 추가 버튼만 보여준다. */
export function ListItemForm({ section, itemId }: { section: ListSection; itemId?: string }) {
  const { document, edit, select } = useEditor();
  const list = document.content[section] as readonly { id: string }[];
  const index = list.findIndex((item) => item.id === itemId);
  const item = list[index];

  const add = () => {
    const created = createContentItem(section, document);
    edit((d) => {
      (d.content[section] as unknown[]).push(created.item);
    });
    select({ kind: "content", section, itemId: created.id });
  };

  const addButton = (
    <Button variant="outline" size="sm" onClick={add}>
      <Plus aria-hidden="true" /> {contentSectionLabels[section]} 추가
    </Button>
  );

  if (!item) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body-sm text-muted-foreground">
          왼쪽 목록에서 항목을 고르거나 새로 추가하세요.
        </p>
        {addButton}
      </div>
    );
  }

  const usages = findContentUsages(document, section, item.id);
  const remove = () => {
    edit((d) => {
      (d.content[section] as { id: string }[]).splice(index, 1);
    });
    select({ kind: "content", section });
  };

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        {section === "projects" ? <ProjectFields index={index} project={item as Project} /> : null}
        {section === "companies" ? <CompanyFields index={index} company={item as Company} /> : null}
        {section === "achievements" ? (
          <AchievementFields index={index} achievement={item as Achievement} />
        ) : null}
        {section === "techStack" ? (
          <TechStackFields index={index} group={item as TechStackGroup} />
        ) : null}
      </FieldGroup>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <DeleteContentButton
          name={
            (item as { title?: string; name?: string; label?: string }).title ??
            (item as Company).name ??
            (item as TechStackGroup).label
          }
          usages={usages}
          onConfirm={remove}
        />
        {addButton}
      </div>
    </div>
  );
}
