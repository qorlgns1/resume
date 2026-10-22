"use client";

import { Button } from "@resume/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@resume/ui/components/tooltip";
import { cn } from "@resume/ui/lib/utils";
import type { ComponentProps } from "react";

type NotReadyButtonProps = Omit<ComponentProps<typeof Button>, "onClick" | "disabled"> & {
  /** 툴팁과 스크린 리더에 전달할 안내 문구 */
  reason: string;
};

/**
 * 아직 구현하지 않은 동작의 버튼.
 * disabled 대신 aria-disabled를 써서 키보드 포커스와 툴팁 안내는 유지하고, 클릭해도 아무 일도 하지 않는다.
 * 저장되지 않았는데 성공처럼 보이는 피드백을 주지 않는다.
 */
export function NotReadyButton({ reason, className, children, ...props }: NotReadyButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...props}
          type="button"
          aria-disabled="true"
          data-not-ready=""
          onClick={(event) => event.preventDefault()}
          className={cn("cursor-not-allowed opacity-50", className)}
        >
          {children}
          <span className="sr-only">({reason})</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
