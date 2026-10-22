"use client";

import {
  ADMIN_MEDIA_BASE,
  MEDIA_ACCEPT_ATTRIBUTE,
  MEDIA_MAX_BYTES,
  type MediaAsset,
  mediaUrl,
} from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { Button } from "@resume/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@resume/ui/components/dialog";
import { cn } from "@resume/ui/lib/utils";
import { Trash2, Upload } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useEditor } from "./editor-context";
import { useMediaLibrary } from "./media-library";

const sizeFormat = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
const formatBytes = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${sizeFormat.format(bytes / 1024 / 1024)}MB`
    : `${sizeFormat.format(bytes / 1024)}KB`;

/** 아직 저장하지 않은 작업본에서 이 이미지를 쓰는지 */
function useWorkingCopyUses() {
  const { document } = useEditor();
  const json = JSON.stringify(document);
  return (id: string) => json.includes(`"assetId":"${id}"`);
}

function Thumbnail({ asset, className }: { asset: MediaAsset; className?: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: 어드민 썸네일은 이미 만든 480px 변환본을 그대로 쓴다
    <img
      src={mediaUrl(ADMIN_MEDIA_BASE, asset.id, asset.widths[0] ?? asset.width)}
      alt=""
      width={asset.width}
      height={asset.height}
      loading="lazy"
      className={cn(
        "aspect-[4/3] w-full rounded-md border border-border bg-muted object-cover",
        className,
      )}
    />
  );
}

/** 이미지 업로드 버튼 (여러 장 가능). 실패한 파일은 이름과 이유를 보여준다. */
export function UploadButton({
  onUploaded,
  children,
}: {
  onUploaded?: (asset: MediaAsset) => void;
  children?: ReactNode;
}) {
  const { upload } = useMediaLibrary();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErrors([]);
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        onUploaded?.(await upload(file));
      } catch (cause) {
        failed.push(
          `${file.name}: ${cause instanceof Error ? cause.message : "올리지 못했습니다."}`,
        );
      }
    }
    setErrors(failed);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={MEDIA_ACCEPT_ATTRIBUTE}
        multiple
        className="sr-only"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload aria-hidden="true" />
        {busy ? "올리는 중…" : (children ?? "이미지 올리기")}
      </Button>
      <p className="text-caption text-muted-foreground">
        JPG·PNG·WebP·GIF, 최대 {MEDIA_MAX_BYTES / 1024 / 1024}MB. 위치 정보 등 사진 정보는 지우고
        저장합니다.
      </p>
      {errors.length > 0 ? (
        <ul
          role="alert"
          className="rounded-md bg-destructive-soft px-3 py-2 text-caption text-destructive"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** 콘텐츠 › 미디어: 업로드한 이미지 관리 */
export function MediaLibraryPanel() {
  const { assets, error, remove, refresh } = useMediaLibrary();
  const usesInWorkingCopy = useWorkingCopyUses();
  // 저장·게시 뒤 바뀐 사용처를 반영하도록 화면을 열 때마다 새로 불러온다.
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <UploadButton />
      {error ? (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
      {deleteError ? (
        <p role="alert" className="text-caption text-destructive">
          {deleteError}
        </p>
      ) : null}
      {assets === null ? <p className="text-body-sm text-muted-foreground">불러오는 중…</p> : null}
      {assets?.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">아직 올린 이미지가 없습니다.</p>
      ) : null}
      <ul className="grid grid-cols-2 gap-3">
        {assets?.map((asset) => {
          const working = usesInWorkingCopy(asset.id);
          const inUse = working || asset.usage.draft || asset.usage.versions.length > 0;
          return (
            <li key={asset.id} className="flex flex-col gap-1.5">
              <Thumbnail asset={asset} />
              <span className="truncate text-caption font-semibold" title={asset.originalName}>
                {asset.originalName}
              </span>
              <span className="text-caption text-subtle-foreground">
                {asset.width}×{asset.height} · {formatBytes(asset.bytes)}
                {asset.animated ? " · 움직이는 이미지" : ""}
              </span>
              <span className="flex flex-wrap gap-1">
                {working ? (
                  <Badge variant="warning" className="rounded-sm">
                    편집 중 사용
                  </Badge>
                ) : null}
                {asset.usage.draft ? (
                  <Badge variant="soft" className="rounded-sm">
                    초안
                  </Badge>
                ) : null}
                {asset.usage.versions.length > 0 ? (
                  <Badge variant="outline" className="rounded-sm">
                    버전 {asset.usage.versions.join(", ")}
                  </Badge>
                ) : null}
              </span>
              {inUse ? (
                <span className="text-caption text-muted-foreground">
                  사용 중이라 삭제할 수 없습니다.
                </span>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="xs" className="self-start text-destructive">
                      <Trash2 aria-hidden="true" /> 삭제
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>"{asset.originalName}"을(를) 삭제할까요?</DialogTitle>
                      <DialogDescription>
                        어디에서도 쓰지 않는 이미지입니다. 삭제하면 되돌릴 수 없습니다.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">취소</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            setDeleteError(null);
                            try {
                              await remove(asset.id);
                            } catch (cause) {
                              setDeleteError(
                                cause instanceof Error ? cause.message : "삭제하지 못했습니다.",
                              );
                            }
                          }}
                        >
                          삭제
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 이미지 하나를 고르는 창. 목록에서 고르거나 새로 올린다. */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (asset: MediaAsset) => void;
}) {
  const { assets } = useMediaLibrary();
  const pick = (asset: MediaAsset) => {
    onPick(asset);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>이미지 고르기</DialogTitle>
          <DialogDescription>
            올린 이미지에서 고르거나 새로 올리세요. 새로 올린 이미지는 바로 선택됩니다.
          </DialogDescription>
        </DialogHeader>
        <UploadButton onUploaded={pick}>새 이미지 올리기</UploadButton>
        <ul className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto p-1">
          {assets?.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => pick(asset)}
                className="flex w-full flex-col gap-1 rounded-md p-1 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Thumbnail asset={asset} />
                <span className="truncate text-caption">{asset.originalName}</span>
              </button>
            </li>
          ))}
        </ul>
        {assets?.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">아직 올린 이미지가 없습니다.</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
