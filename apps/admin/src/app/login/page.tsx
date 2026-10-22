import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/server/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · 포트폴리오 어드민" };

export default async function LoginPage() {
  await connection();
  if (await getSession()) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl bg-card p-6 shadow-card sm:p-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-title font-bold tracking-tight">포트폴리오 어드민</h1>
          <p className="text-body-sm text-muted-foreground">관리자 계정으로 로그인하세요.</p>
        </header>
        <LoginForm />
        <p className="text-caption text-subtle-foreground">
          계정은 서버에서 <code className="font-mono">admin:create</code> 명령으로 만듭니다.
          비밀번호를 잊었다면 <code className="font-mono">admin:reset-password</code>를 실행하세요.
        </p>
      </div>
    </main>
  );
}
