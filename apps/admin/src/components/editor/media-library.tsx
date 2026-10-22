"use client";

import type { MediaAsset } from "@resume/contracts";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { adminApi } from "./api-client";

/*
 * 업로드 이미지 목록. 미디어 화면, 커버 선택, 본문 편집기가 같은 목록을 쓴다.
 * 본문 편집기의 변환기는 이미지 크기를 알아야 하므로 ID로 찾는 lookup도 제공한다.
 */

interface MediaLibraryValue {
  assets: MediaAsset[] | null;
  error: string | null;
  refresh: () => Promise<void>;
  upload: (file: File) => Promise<MediaAsset>;
  remove: (id: string) => Promise<void>;
  lookup: (id: string) => MediaAsset | undefined;
}

const MediaLibraryContext = createContext<MediaLibraryValue | null>(null);

export function MediaLibraryProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 업로드 직후 목록이 다시 그려지기 전에도 찾을 수 있도록 ref에도 둔다.
  const byId = useRef(new Map<string, MediaAsset>());

  const remember = useCallback((list: MediaAsset[]) => {
    for (const asset of list) byId.current.set(asset.id, asset);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list = await adminApi.listMedia();
      remember(list);
      setAssets(list);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "이미지 목록을 불러오지 못했습니다.");
    }
  }, [remember]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<MediaLibraryValue>(
    () => ({
      assets,
      error,
      refresh,
      upload: async (file) => {
        const asset = await adminApi.uploadMedia(file);
        remember([asset]);
        setAssets((current) => [asset, ...(current ?? [])]);
        return asset;
      },
      remove: async (id) => {
        await adminApi.deleteMedia(id);
        byId.current.delete(id);
        setAssets((current) => current?.filter((a) => a.id !== id) ?? null);
      },
      lookup: (id) => byId.current.get(id),
    }),
    [assets, error, refresh, remember],
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
}

export function useMediaLibrary(): MediaLibraryValue {
  const value = useContext(MediaLibraryContext);
  if (!value) throw new Error("MediaLibraryProvider가 없습니다.");
  return value;
}
