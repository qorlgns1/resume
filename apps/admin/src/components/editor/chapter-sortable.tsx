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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@resume/ui/lib/utils";
import { GripVertical } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

/*
 * 미리보기에서 히스토리 챕터 순서를 끌어서 바꾼다.
 * 미리보기는 transform: scale()로 축소되어 있어서, 화면 좌표로 계산된 이동 거리를 축소 비율로 나눠 적용한다.
 */

const ScaleContext = createContext(1);

interface ChapterSortProviderProps {
  chapters: readonly { id: string; title: string }[];
  /** 미리보기 축소 비율 */
  scale: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
}

export function ChapterSortProvider({
  chapters,
  scale,
  onMove,
  children,
}: ChapterSortProviderProps) {
  const sensors = useSensors(
    // 조금 움직여야 끌기가 시작되어 손잡이 클릭과 겹치지 않는다.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = chapters.map((c) => c.id);
  const title = (id: string | number) => chapters.find((c) => c.id === id)?.title ?? "챕터";
  const position = (id: string | number) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `${title(active.id)}을 잡았습니다. ${position(active.id)}번째입니다.`,
    onDragOver: ({ active, over }) =>
      over ? `${title(active.id)}이 ${position(over.id)}번째 위치에 있습니다.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${title(active.id)}을 ${position(over.id)}번째로 옮겼습니다.` : undefined,
    onDragCancel: ({ active }) => `${title(active.id)} 옮기기를 취소했습니다.`,
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
            draggable:
              "스페이스나 엔터로 챕터를 잡고, 위아래 방향키로 옮긴 뒤 다시 스페이스나 엔터로 놓습니다. Esc로 취소합니다.",
          },
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </DndContext>
    </ScaleContext.Provider>
  );
}

/** 챕터 카드 하나. 오른쪽 위 손잡이를 잡고 끌어 순서를 바꾼다. */
export function SortableChapter({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
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
      className={cn("group/chapter relative", isDragging && "z-10 opacity-90 shadow-lg")}
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
          "absolute top-3 right-3 z-10 flex size-8 cursor-grab touch-none items-center justify-center rounded-md border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover/chapter:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing",
          isDragging && "cursor-grabbing opacity-100",
        )}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
