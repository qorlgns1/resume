/**
 * 관리자 계정 CLI. 서버에 접근할 수 있는 사람만 계정을 만들고 비밀번호를 바꿀 수 있다.
 *
 *   create          관리자 계정 만들기 (이미 있으면 거부)
 *   reset-password  비밀번호 재설정 (모든 로그인 세션도 끊는다)
 *
 * 개발:   pnpm --filter @resume/admin admin:create
 * Docker: docker compose exec -it admin node cli.mjs create
 *
 * 비밀번호는 화면에 표시하지 않고 두 번 입력받는다.
 * 자동화(테스트 등)에서는 ADMIN_USERNAME, ADMIN_PASSWORD 환경 변수로 넘길 수 있다.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { createAuth, MIN_PASSWORD_LENGTH } from "../src/server/auth/config";
import { openDatabase } from "../src/server/db/open";
import { getAuthSecret, getDatabasePath, getMigrationsDir } from "../src/server/env";

const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

class CliError extends Error {}

function ask(question: string, { hidden = false } = {}): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({
    input: process.stdin,
    output,
    terminal: process.stdin.isTTY ?? false,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

async function readUsername(): Promise<string> {
  const value = (
    process.env.ADMIN_USERNAME ?? (await ask("아이디 (영문 소문자·숫자·_·., 3~30자): "))
  )
    .trim()
    .toLowerCase();
  if (!USERNAME_PATTERN.test(value)) {
    throw new CliError("아이디는 영문 소문자·숫자·밑줄(_)·마침표(.)로 3~30자여야 합니다.");
  }
  return value;
}

async function readNewPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;
  const password =
    fromEnv ?? (await ask(`새 비밀번호 (${MIN_PASSWORD_LENGTH}자 이상): `, { hidden: true }));
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new CliError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  }
  if (password.length > 128) throw new CliError("비밀번호는 128자 이하여야 합니다.");
  if (fromEnv === undefined) {
    const confirm = await ask("비밀번호 확인: ", { hidden: true });
    if (confirm !== password) throw new CliError("두 비밀번호가 다릅니다.");
  }
  return password;
}

async function main() {
  const command = process.argv[2];
  if (command !== "create" && command !== "reset-password") {
    console.log("사용법: cli <create | reset-password>");
    process.exitCode = command ? 1 : 0;
    return;
  }

  const { sqlite, db } = openDatabase(getDatabasePath(), getMigrationsDir());
  try {
    // CLI는 웹 요청을 받지 않으므로 주소가 없어도 된다.
    const baseURL = process.env.ADMIN_URL?.trim() || "http://localhost";
    const auth = createAuth({ db, secret: getAuthSecret(), baseURL });
    const ctx = await auth.$context;
    const userCount = await ctx.internalAdapter.countTotalUsers();

    if (command === "create") {
      if (userCount > 0) {
        throw new CliError(
          "이미 관리자 계정이 있습니다. 비밀번호를 잊었다면 reset-password를 실행하세요.",
        );
      }
      const username = await readUsername();
      const password = await readNewPassword();
      const user = await ctx.internalAdapter.createUser({
        // 이메일은 Better Auth의 필수 필드라 사용하지 않는 예약 도메인(.invalid)으로 채운다.
        email: `${username}@admin.invalid`,
        name: username,
        username,
        displayUsername: username,
        emailVerified: true,
      });
      await ctx.internalAdapter.linkAccount({
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: await ctx.password.hash(password),
      });
      console.log(`관리자 계정을 만들었습니다: ${username}`);
      return;
    }

    if (userCount === 0) throw new CliError("관리자 계정이 없습니다. 먼저 create를 실행하세요.");
    const [user] = await ctx.internalAdapter.listUsers(1);
    if (!user) throw new CliError("관리자 계정을 찾지 못했습니다.");
    console.log(
      `비밀번호를 재설정합니다: ${(user as { username?: string }).username ?? user.name}`,
    );
    const password = await readNewPassword();
    await ctx.internalAdapter.updatePassword(user.id, await ctx.password.hash(password));
    await ctx.internalAdapter.deleteUserSessions(user.id);
    console.log("비밀번호를 바꾸고 모든 로그인 세션을 끊었습니다.");
  } finally {
    sqlite.close();
  }
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(`오류: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
