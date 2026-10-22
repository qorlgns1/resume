import type { ModuleInstance, ModuleStyleOverride } from "@resume/contracts";
import { cn } from "@resume/ui/lib/utils";
import type { ReactNode } from "react";
import { moduleStyleVars } from "./style-vars";

interface ModuleFrameProps {
  module: ModuleInstance;
  mobileStyle?: ModuleStyleOverride | undefined;
  className?: string;
  children: ReactNode;
}

/** 모듈 하나의 카드 프레임. 배경·여백·정렬·테두리·글자 크기를 CSS 변수로 적용한다. */
export function ModuleFrame({ module, mobileStyle, className, children }: ModuleFrameProps) {
  return (
    <section
      id={module.id}
      data-module-id={module.id}
      data-module-type={module.type}
      aria-label={module.label}
      className={cn("rs-mod", className)}
      style={moduleStyleVars(module.style, mobileStyle)}
    >
      {children}
    </section>
  );
}
