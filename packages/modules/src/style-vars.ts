import type { ModuleStyle, ModuleStyleOverride } from "@resume/contracts";
import type { CSSProperties } from "react";

/*
 * 모듈 스타일 enum → CSS 변수 값.
 * 임의 CSS를 저장하지 않고, 여기서 디자인 토큰으로만 해석한다.
 */

interface Palette {
  bg: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  line: string;
  raised: string;
  accentText: string;
  shadow: string;
}

const lightText = {
  fg: "var(--rs-color-text)",
  fgMuted: "var(--rs-color-text-muted)",
  fgSubtle: "var(--rs-color-text-subtle)",
  line: "var(--rs-color-border)",
  accentText: "var(--rs-color-primary-text)",
};

const palettes: Record<ModuleStyle["background"], Palette> = {
  surface: {
    ...lightText,
    bg: "var(--rs-color-surface)",
    raised: "var(--rs-color-surface-muted)",
    shadow: "var(--rs-shadow-card)",
  },
  muted: {
    ...lightText,
    bg: "var(--rs-color-surface-muted)",
    raised: "var(--rs-color-surface)",
    shadow: "none",
  },
  "primary-soft": {
    ...lightText,
    bg: "var(--rs-color-primary-soft)",
    raised: "var(--rs-color-surface)",
    shadow: "none",
  },
  transparent: {
    ...lightText,
    bg: "transparent",
    raised: "var(--rs-color-surface)",
    shadow: "none",
  },
  inverse: {
    bg: "var(--rs-color-surface-inverse)",
    fg: "var(--rs-color-text-inverse)",
    fgMuted: "var(--rs-color-text-inverse-muted)",
    fgSubtle: "var(--rs-color-text-inverse-muted)",
    line: "var(--rs-color-border-inverse)",
    raised: "var(--rs-color-surface-inverse-raised)",
    accentText: "var(--rs-color-primary-text-inverse)",
    shadow: "none",
  },
};

const padding: Record<ModuleStyle["padding"], string> = {
  none: "0px",
  sm: "var(--rs-card-padding-sm)",
  md: "var(--rs-card-padding-md)",
  lg: "var(--rs-card-padding-lg)",
};

const scale: Record<ModuleStyle["textScale"], string> = { sm: "0.9", md: "1", lg: "1.12" };

const border: Record<ModuleStyle["border"], (p: Palette) => string> = {
  none: () => "transparent",
  subtle: (p) => p.line,
  strong: () => "var(--rs-color-border-strong)",
};

function toVars(style: ModuleStyle, suffix: "m" | "d"): Record<string, string> {
  const p = palettes[style.background];
  const transparent = style.background === "transparent";
  return {
    [`--mod-bg-${suffix}`]: p.bg,
    [`--mod-fg-${suffix}`]: p.fg,
    [`--mod-fg-muted-${suffix}`]: p.fgMuted,
    [`--mod-fg-subtle-${suffix}`]: p.fgSubtle,
    [`--mod-line-${suffix}`]: p.line,
    [`--mod-raised-${suffix}`]: p.raised,
    [`--mod-accent-text-${suffix}`]: p.accentText,
    [`--mod-shadow-${suffix}`]: p.shadow,
    [`--mod-pad-${suffix}`]: padding[style.padding],
    [`--mod-scale-${suffix}`]: scale[style.textScale],
    [`--mod-align-${suffix}`]: style.align === "center" ? "center" : "start",
    [`--mod-justify-${suffix}`]: style.align === "center" ? "center" : "flex-start",
    [`--mod-border-${suffix}`]: border[style.border](p),
    [`--mod-radius-${suffix}`]: transparent ? "0px" : "var(--rs-radius-xl)",
  };
}

/** 데스크톱 스타일과 모바일 덮어쓰기를 합쳐 모듈 프레임의 인라인 CSS 변수로 만든다. */
export function moduleStyleVars(
  style: ModuleStyle,
  mobileOverride?: ModuleStyleOverride,
): CSSProperties {
  return {
    ...toVars(style, "d"),
    ...toVars({ ...style, ...mobileOverride }, "m"),
  } as CSSProperties;
}
