import type { NavItem, SiteSettings } from "@resume/contracts";
import { BrandMark } from "@resume/modules";
import Link from "next/link";
import { SiteMenu, SiteNav } from "./site-menu";

interface SiteHeaderProps {
  name: string;
  role: string;
  navigation: NavItem[] | null;
  logo: SiteSettings["logo"];
}

export function SiteHeader({ name, role, navigation, logo }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 py-4">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-sm">
        <BrandMark name={name} logo={logo} options={{}} />
        <span className="flex min-w-0 items-baseline gap-3">
          <span className="text-title font-extrabold tracking-tight">{name}</span>
          <span className="truncate text-body-sm text-muted-foreground">{role}</span>
        </span>
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
