import type { NavItem } from "@resume/contracts";
import Link from "next/link";
import { SiteMenu, SiteNav } from "./site-menu";

interface SiteHeaderProps {
  name: string;
  role: string;
  navigation: NavItem[] | null;
}

export function SiteHeader({ name, role, navigation }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 py-4">
      <Link href="/" className="flex min-w-0 items-baseline gap-3 rounded-sm">
        <span className="text-title font-extrabold tracking-tight">{name}</span>
        <span className="truncate text-body-sm text-muted-foreground">{role}</span>
      </Link>
      {navigation ? (
        <>
          <SiteNav items={navigation} />
          <SiteMenu items={navigation} />
        </>
      ) : null}
    </header>
  );
}
