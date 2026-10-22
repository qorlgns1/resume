/**
 * 서버 시작 시 한 번 실행된다(빌드 중에는 실행되지 않음).
 * Node 전용 시작 작업은 instrumentation-node.ts에 둔다.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
