import type { SiteSettings } from "@resume/contracts";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter({ name, footer }: { name: string; footer: SiteSettings["footer"] }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border py-6 text-body-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="font-bold">{name}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
        {footer.links.length > 0 ? (
          <ul className="flex flex-wrap gap-4">
            {footer.links.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {link.label}
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    {external ? <span className="sr-only"> (새 탭에서 열림)</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
        {footer.note ? <p className="text-caption text-subtle-foreground">{footer.note}</p> : null}
      </div>
    </footer>
  );
}
