"use client";

import "@blocknote/shadcn/style.css";
import "./block-editor.css";
import type { BlockNoteEditor } from "@blocknote/core";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { ko } from "@blocknote/core/locales";
import {
  type DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { ADMIN_MEDIA_BASE, type Block, type MediaAsset, mediaUrl } from "@resume/contracts";
import { Info } from "lucide-react";
import { useRef } from "react";
import { blocksToEditor, type ConversionResult, editorToBlocks } from "./convert";
import { type EditorSchema, editorSchema } from "./schema";

interface BlockEditorProps {
  initialBlocks: readonly Block[];
  onChange: (result: ConversionResult) => void;
  /** 이미지 블록에 파일을 올린다 (우리 미디어 저장소) */
  uploadMedia: (file: File) => Promise<MediaAsset>;
  lookupMedia: (assetId: string) => MediaAsset | undefined;
  /** 편집 영역의 접근성 이름 */
  label: string;
}

type Editor = BlockNoteEditor<
  EditorSchema["blockSchema"],
  EditorSchema["inlineContentSchema"],
  EditorSchema["styleSchema"]
>;

/** 기본 슬래시 메뉴에서 저장 형식에 없는 항목(이모지)을 빼고 안내 상자를 더한다. */
function slashMenuItems(editor: Editor): DefaultReactSuggestionItem[] {
  const defaults = getDefaultReactSlashMenuItems(editor).filter(
    (item) => item.title !== ko.slash_menu.emoji.title,
  );
  const callout: DefaultReactSuggestionItem = {
    title: "안내 상자",
    subtext: "눈에 띄게 강조하는 짧은 안내",
    aliases: ["callout", "안내", "알림", "콜아웃"],
    group: ko.slash_menu.paragraph.group,
    icon: <Info size={18} aria-hidden="true" />,
    onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" }),
  };
  return [...defaults, callout];
}

/**
 * 노션형 본문 편집기 (BlockNote).
 * 저장 형식은 @resume/contracts의 Block[]이며, 편집기 내부 형식은 convert.ts에서만 다룬다.
 * 브라우저 전용이므로 next/dynamic(ssr: false)으로 불러온다.
 */
export function BlockEditor({
  initialBlocks,
  onChange,
  label,
  uploadMedia,
  lookupMedia,
}: BlockEditorProps) {
  const initialContent = blocksToEditor(initialBlocks);
  // 편집기는 한 번만 만들어지므로 최신 함수는 ref로 넘긴다.
  const uploadRef = useRef(uploadMedia);
  uploadRef.current = uploadMedia;
  const editor = useCreateBlockNote({
    schema: editorSchema,
    dictionary: ko,
    initialContent: initialContent.length > 0 ? initialContent : undefined,
    domAttributes: { editor: { "aria-label": label } },
    uploadFile: async (file: File) => {
      const asset = await uploadRef.current(file);
      return mediaUrl(ADMIN_MEDIA_BASE, asset.id, asset.widths.at(-1) ?? asset.width);
    },
  });

  return (
    <div className="rs-block-editor rounded-lg border border-input bg-background py-3">
      <BlockNoteView
        editor={editor}
        theme="light"
        slashMenu={false}
        emojiPicker={false}
        onChange={() => onChange(editorToBlocks(editor.document, { lookupMedia }))}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(slashMenuItems(editor), query)}
        />
      </BlockNoteView>
    </div>
  );
}
