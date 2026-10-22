import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * 디자인 토큰에서 추가한 글자 크기·그림자 유틸리티를 tailwind-merge에 알려준다.
 * 등록하지 않으면 `text-body`가 색상 클래스로 오인되어 `text-muted-foreground`와 충돌한다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "body-sm", "body", "body-lg", "title", "heading", "display-sm", "display"],
      shadow: ["card", "overlay"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
