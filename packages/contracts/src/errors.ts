import { z } from "zod";

/**
 * 검증 오류를 한국어 문장으로 바꾼다. 어드민 화면과 관리자 API에서 한 번 호출한다.
 * 자주 나오는 경우는 직접 문장을 만들고, 나머지는 Zod 내장 한국어 메시지를 쓴다.
 * 스키마에 직접 적은 메시지(정규식 안내 등)가 있으면 그대로 쓴다.
 */
export function configureKoreanErrors(): void {
  z.config(z.locales.ko());
  z.config({
    customError: (issue) => {
      if (issue.code === "too_big") {
        const max = Number(issue.maximum);
        if (issue.origin === "string") return `${max}자 이하로 입력하세요.`;
        if (issue.origin === "array") return `${max}개까지 넣을 수 있습니다.`;
        if (issue.origin === "number") return `${max} 이하로 입력하세요.`;
      }
      if (issue.code === "too_small") {
        const min = Number(issue.minimum);
        if (issue.origin === "string")
          return min <= 1 ? "값을 입력하세요." : `${min}자 이상 입력하세요.`;
        if (issue.origin === "array") return `${min}개 이상 선택하세요.`;
        if (issue.origin === "number") return `${min} 이상으로 입력하세요.`;
      }
      if (issue.code === "invalid_type" && issue.expected === "number") return "숫자를 입력하세요.";
      return undefined;
    },
  });
}
