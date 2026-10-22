import { buttonVariants } from "@resume/ui/components/button";
import Link from "next/link";
import { PageContainer } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageContainer>
      <main id="main" className="flex flex-1 flex-col items-start justify-center gap-4 py-16">
        <p className="text-body-sm font-semibold text-primary-text">404</p>
        <h1 className="text-display-sm font-extrabold tracking-tight">페이지를 찾을 수 없습니다</h1>
        <p className="text-body text-muted-foreground">
          주소가 바뀌었거나 아직 만들어지지 않은 페이지입니다.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          홈으로 돌아가기
        </Link>
      </main>
    </PageContainer>
  );
}
