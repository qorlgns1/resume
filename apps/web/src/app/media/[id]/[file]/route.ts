import { ADMIN_MEDIA_BASE } from "@resume/contracts";
import { ContentConfigError, readContentSourceConfig } from "@/lib/content/config";

export const dynamic = "force-dynamic";

const notFound = () =>
  new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });

/*
 * 업로드 이미지 전달. 방문자는 공개 사이트 주소(/media/...)만 알면 되고, 어드민 주소는 서버끼리만 쓴다.
 * 변환본 주소의 내용은 바뀌지 않으므로 브라우저·CDN이 오래 캐시해도 된다.
 * 샘플 모드에는 업로드 이미지가 없으므로 404를 돌려준다.
 */
export async function GET(_request: Request, context: RouteContext<"/media/[id]/[file]">) {
  const { id, file } = await context.params;
  // 어드민으로 넘기기 전에 형식을 확인해 엉뚱한 경로로의 요청을 막는다.
  if (!/^med_[a-f0-9]{16}$/.test(id) || !/^\d{1,5}\.webp$/.test(file)) return notFound();

  let config: ReturnType<typeof readContentSourceConfig>;
  try {
    config = readContentSourceConfig();
  } catch (error) {
    if (error instanceof ContentConfigError) return notFound();
    throw error;
  }
  if (config.mode !== "api") return notFound();

  let upstream: Response;
  try {
    upstream = await fetch(`${config.baseUrl}${ADMIN_MEDIA_BASE}/${id}/${file}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    console.error(`[media] ${id}/${file} 요청 실패`, error);
    return new Response("Bad Gateway", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  if (!upstream.ok || !upstream.body) return notFound();

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length") as string }
        : {}),
    },
  });
}
