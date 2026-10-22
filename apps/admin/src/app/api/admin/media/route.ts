import { MEDIA_MAX_BYTES } from "@resume/contracts";
import { InvalidRequestError, json, withAdmin } from "@/server/admin-api";
import { listMedia, MediaRejectedError, saveUpload } from "@/server/media-store";

export const dynamic = "force-dynamic";

/** 업로드한 이미지 목록 (사용처 포함) */
export function GET(request: Request) {
  return withAdmin(request, () => json({ assets: listMedia() }));
}

/** 이미지 업로드: multipart/form-data, 필드 이름 "file" */
export function POST(request: Request) {
  return withAdmin(request, async () => {
    // 본문 전체를 읽기 전에 선언된 크기로 먼저 거른다 (폼 경계 등 여유분 포함).
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MEDIA_MAX_BYTES + 64 * 1024) {
      throw new MediaRejectedError(
        "too_large",
        `파일은 ${MEDIA_MAX_BYTES / 1024 / 1024}MB까지 올릴 수 있습니다.`,
      );
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new InvalidRequestError("multipart/form-data 본문이 필요합니다.");
    }
    const file = form.get("file");
    if (!(file instanceof File))
      throw new InvalidRequestError("file 필드에 이미지를 담아 보내세요.");
    const asset = await saveUpload({
      name: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
    });
    return json({ asset }, 201);
  });
}
