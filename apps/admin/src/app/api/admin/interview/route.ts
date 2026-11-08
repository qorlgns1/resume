import { CreateInterviewNoteRequestSchema } from "@resume/contracts";
import { json, readJson, withAdmin } from "@/server/admin-api";
import { createInterviewNote, listInterviewNotes } from "@/server/interview-repository";

export const dynamic = "force-dynamic";

/** 면접 노트 목록 (순서대로) */
export function GET(request: Request) {
  return withAdmin(request, () => json({ notes: listInterviewNotes() }));
}

/** 새 면접 노트 (목록 맨 뒤) */
export function POST(request: Request) {
  return withAdmin(request, async () => {
    const body = await readJson(request, CreateInterviewNoteRequestSchema);
    return json({ note: createInterviewNote(body) }, 201);
  });
}
