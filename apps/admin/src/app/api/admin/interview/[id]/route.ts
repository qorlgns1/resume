import { UpdateInterviewNoteRequestSchema } from "@resume/contracts";
import { json, readJson, withAdmin } from "@/server/admin-api";
import { deleteInterviewNote, updateInterviewNote } from "@/server/interview-repository";

export const dynamic = "force-dynamic";

/** 면접 노트 수정. revision이 현재 값과 다르면 409 */
export function PUT(request: Request, context: RouteContext<"/api/admin/interview/[id]">) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    const body = await readJson(request, UpdateInterviewNoteRequestSchema);
    return json({ note: updateInterviewNote(id, body) });
  });
}

/** 면접 노트 삭제 */
export function DELETE(request: Request, context: RouteContext<"/api/admin/interview/[id]">) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    deleteInterviewNote(id);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  });
}
