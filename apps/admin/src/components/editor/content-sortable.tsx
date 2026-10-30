"use client";

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@resume/ui/lib/utils";
import { GripVertical } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

/*
 * 미리보기에서 히스토리 챕터·개인 프로젝트의 순서를, 사이드바에서 페이지 순서를 끌어서 바꾼다.
 * 미리보기는 transform: scale()로 축소되어 있어서, 화면 좌표로 계산된 이동 거리를 축소 비율로 나눠 적용한다.
 */

const ScaleContext = createContext(1);

interface ContentSortProviderProps {
  items: readonly { id: string; label: string }[];
  /** 안내 문구에 쓰는 항목 이름 (예: 챕터, 프로젝트) */
  noun: string;
  /** 세로 목록이면 "list", 여러 칸 그리드면 "grid" */
  layout: "list" | "grid";
  /** 미리보기 축소 비율 */
  scale: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
}

export function ContentSortProvider({
  items,
  noun,
  layout,
  scale,
  onMove,
  children,
}: ContentSortProviderProps) {
  const sensors = useSensors(
    // 조금 움직여야 끌기가 시작되어 손잡이 클릭과 겹치지 않는다.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((item) => item.id);
  const label = (id: string | number) => items.find((item) => item.id === id)?.label ?? noun;
  const position = (id: string | number) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `${label(active.id)}을 잡았습니다. ${position(active.id)}번째입니다.`,
    onDragOver: ({ active, over }) =>
      over ? `${label(active.id)}이 ${position(over.id)}번째 위치에 있습니다.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${label(active.id)}을 ${position(over.id)}번째로 옮겼습니다.` : undefined,
    onDragCancel: ({ active }) => `${label(active.id)} 옮기기를 취소했습니다.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  }

  return (
    <ScaleContext.Provider value={scale}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: `스페이스나 엔터로 ${noun}를 잡고, 방향키로 옮긴 뒤 다시 스페이스나 엔터로 놓습니다. Esc로 취소합니다.`,
          },
        }}
      >
        <SortableContext
          items={ids}
          strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </DndContext>
    </ScaleContext.Provider>
  );
}

/** 순서를 바꿀 수 있는 카드 하나. 오른쪽 위 손잡이를 잡고 끌어 옮긴다. */
export function SortableItem({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const scale = useContext(ScaleContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/sortable relative",
        isDragging && "z-10 opacity-90 shadow-lg",
        className,
      )}
      style={{
        transform: transform
          ? `translate3d(${transform.x / scale}px, ${transform.y / scale}px, 0)`
          : undefined,
        transition,
      }}
    >
      {children}
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`${label} 순서 바꾸기`}
        {...attributes}
        {...listeners}
        className={cn(
          "absolute top-3 right-3 z-10 flex size-8 cursor-grab touch-none items-center justify-center rounded-md border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover/sortable:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing",
          isDragging && "cursor-grabbing opacity-100",
        )}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

/** 순서를 바꿀 수 있는 목록 한 줄. 왼쪽 손잡이를 잡고 끌어 옮긴다. (사이드바처럼 축소되지 않은 곳) */
export function SortableRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/sortable relative flex items-center rounded-md",
        isDragging && "z-10 bg-card shadow-lg",
      )}
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
      }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`${label} 순서 바꾸기`}
        {...attributes}
        {...listeners}
        className={cn(
          "flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-subtle-foreground opacity-0 transition-opacity group-hover/sortable:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing",
          isDragging && "cursor-grabbing opacity-100",
        )}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
