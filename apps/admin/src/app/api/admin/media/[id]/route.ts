import { withAdmin } from "@/server/admin-api";
import { deleteMedia } from "@/server/media-store";

export const dynamic = "force-dynamic";

/** 이미지 삭제. 초안이나 게시 버전에서 쓰고 있으면 409 */
export function DELETE(request: Request, context: RouteContext<"/api/admin/media/[id]">) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    await deleteMedia(id);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  });
}
