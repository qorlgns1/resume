"use client";

import type { NavItem } from "@resume/contracts";
import { Button } from "@resume/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@resume/ui/components/sheet";
import { cn } from "@resume/ui/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 오른쪽에서 열리는 사이트 메뉴.
 * Radix Dialog 기반 Sheet가 포커스 가두기, Escape 닫기, 트리거로 포커스 복원, 배경 스크롤 잠금을 처리한다.
 * 애니메이션은 prefers-reduced-motion에서 토큰의 전역 규칙으로 사실상 꺼진다.
 */
/** 홈은 정확히 일치할 때만, 나머지는 하위 경로까지 현재 메뉴로 본다. */
function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** 넓은 화면에서 머리글 오른쪽에 펼쳐 두는 메뉴. 좁은 화면에서는 SiteMenu가 대신한다. */
export function SiteNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="주 메뉴" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center rounded-md px-3 text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
                  active &&
                    "text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SiteMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="border-border bg-card lg:hidden"
          aria-label="메뉴 열기"
        >
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0 sm:max-w-sm">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-title">메뉴</SheetTitle>
          <SheetDescription className="sr-only">사이트의 페이지로 이동합니다.</SheetDescription>
        </SheetHeader>
        <nav aria-label="주 메뉴" className="px-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <li key={item.id}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-md px-3 text-body-lg font-semibold transition-colors hover:bg-accent",
                        active && "bg-primary-soft text-primary-text",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
