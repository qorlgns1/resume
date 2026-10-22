import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { openVariant } from "@/server/media-store";

export const dynamic = "force-dynamic";

/*
 * 업로드 이미지 변환본 제공 (공개, 인증 없음).
 * 공개 사이트는 이 주소를 서버에서 받아 자신의 /media 주소로 전달한다.
 * 이미지 ID는 추측하기 어려운 무작위 값이지만, 초안에만 쓴 이미지도 ID를 알면 열 수 있다.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/public/v1/media/[id]/[file]">,
) {
  const { id, file } = await context.params;
  const match = /^(\d{1,5})\.webp$/.exec(file);
  const variant = match ? await openVariant(id, Number(match[1])) : null;
  if (!variant) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const stream = Readable.toWeb(createReadStream(variant.file)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(variant.size),
      // 같은 주소의 내용은 바뀌지 않는다 (새 업로드는 새 ID)
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
