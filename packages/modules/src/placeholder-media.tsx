import { cn } from "@resume/ui/lib/utils";

interface PlaceholderMediaProps {
  label: string;
  alt: string;
  variant?: "window" | "phone";
  className?: string;
}

/**
 * 실제 이미지가 없을 때 쓰는 추상적인 예시 화면.
 * 가짜 UI를 그리지 않고 회색 막대만 사용하며, "예시 화면" 문구를 항상 표시한다.
 */
export function PlaceholderMedia({
  label,
  alt,
  variant = "window",
  className,
}: PlaceholderMediaProps) {
  if (variant === "phone") {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "relative mx-auto flex aspect-[9/18] w-full max-w-[11rem] flex-col gap-2 rounded-[1.75rem] border-[5px] border-inverse-border bg-muted p-3 pt-6",
          className,
        )}
      >
        <span className="absolute top-2 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-inverse-border" />
        <span className="h-2 w-1/2 rounded-full bg-border-strong" />
        <span className="mt-1 flex flex-col gap-1.5 rounded-lg bg-white p-2.5">
          <span className="h-1.5 w-1/3 rounded-full bg-border" />
          <span className="h-3 w-2/3 rounded-full bg-border-strong" />
          <span className="mt-1 h-1.5 w-full rounded-full bg-primary-soft">
            <span className="block h-full w-2/3 rounded-full bg-primary" />
          </span>
        </span>
        <span className="grid grid-cols-2 gap-1.5">
          <span className="h-9 rounded-md bg-white" />
          <span className="h-9 rounded-md bg-white" />
        </span>
        <span className="h-6 rounded-md bg-primary/85" />
        <span className="mt-auto text-center text-[10px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "rs-raised rs-line relative flex aspect-[16/10] w-full flex-col gap-2 overflow-hidden rounded-lg border p-3",
        className,
      )}
    >
      <span className="flex gap-1">
        <span className="size-1.5 rounded-full bg-border-strong" />
        <span className="size-1.5 rounded-full bg-border-strong" />
        <span className="size-1.5 rounded-full bg-border-strong" />
      </span>
      <span className="flex flex-1 gap-2">
        <span className="hidden w-1/4 flex-col gap-1.5 rounded-md bg-white/70 p-2 @[18rem]:flex">
          <span className="h-1.5 w-3/4 rounded-full bg-border" />
          <span className="h-1.5 w-1/2 rounded-full bg-border" />
          <span className="h-1.5 w-2/3 rounded-full bg-border" />
        </span>
        <span className="flex flex-1 flex-col gap-1.5 rounded-md bg-white p-2.5">
          <span className="h-2 w-1/2 rounded-full bg-border-strong" />
          <span className="h-1.5 w-3/4 rounded-full bg-border" />
          <span className="mt-1 h-5 rounded-md border border-secondary" />
          <span className="h-5 rounded-md border border-secondary" />
        </span>
      </span>
      <span className="absolute right-2 bottom-2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
