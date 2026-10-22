"use client";

import { Button } from "@resume/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@resume/ui/components/field";
import { Input } from "@resume/ui/components/input";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

function errorMessage(status: number | undefined): string {
  if (status === 429) return "로그인 시도가 너무 많습니다. 1분 뒤에 다시 시도하세요.";
  if (status === 401 || status === 400) return "아이디 또는 비밀번호가 올바르지 않습니다.";
  return "로그인하지 못했습니다. 잠시 후 다시 시도하세요.";
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.username({
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (signInError) {
      setError(errorMessage(signInError.status));
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <Field data-invalid={error ? "true" : undefined}>
          <FieldLabel htmlFor="username">아이디</FieldLabel>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={error ? true : undefined}
          />
        </Field>
        <Field data-invalid={error ? "true" : undefined}>
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
          />
        </Field>
        {error ? <FieldError id="login-error">{error}</FieldError> : null}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "로그인 중…" : "로그인"}
        </Button>
      </FieldGroup>
    </form>
  );
}
