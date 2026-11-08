import { ReorderInterviewNotesRequestSchema } from "@resume/contracts";
import { json, readJson, withAdmin } from "@/server/admin-api";
import { reorderInterviewNotes } from "@/server/interview-repository";

export const dynamic = "force-dynamic";

/** 면접 노트 순서 바꾸기: 전체 ID를 새 순서대로 보낸다 */
export function PUT(request: Request) {
  return withAdmin(request, async () => {
    const body = await readJson(request, ReorderInterviewNotesRequestSchema);
    return json({ notes: reorderInterviewNotes(body.ids) });
  });
}
