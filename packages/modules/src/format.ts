import type {
  Period,
  ProjectIconKey,
  ProjectStatus,
  ProjectTone,
  YearMonth,
} from "@resume/contracts";

export function formatYearMonth(value: YearMonth): string {
  return value.replace("-", ".");
}

export function formatPeriod(period: Period): string {
  return `${formatYearMonth(period.start)} – ${period.end ? formatYearMonth(period.end) : "현재"}`;
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  live: "운영 중",
  "in-development": "개발 중",
  paused: "일시 중단",
  archived: "종료",
};

/** 어드민 선택지에 보이는 아이콘 이름. 이 순서대로 보여준다. */
export const projectIconLabel: Record<ProjectIconKey, string> = {
  home: "집",
  pen: "펜",
  leaf: "잎",
  clock: "시계",
  code: "코드",
  sparkles: "반짝임",
  coins: "동전",
  wallet: "지갑",
  "piggy-bank": "저금통",
  chart: "차트",
  calendar: "달력",
  bell: "알림",
  book: "책",
  graduation: "학사모",
  message: "말풍선",
  heart: "하트",
  globe: "지구",
  "map-pin": "위치",
  plane: "비행기",
  smartphone: "휴대폰",
  camera: "카메라",
  music: "음악",
  game: "게임",
  cart: "장바구니",
  utensils: "식사",
  coffee: "커피",
  dumbbell: "운동",
  palette: "팔레트",
  terminal: "터미널",
  bot: "로봇",
  rocket: "로켓",
  zap: "번개",
};

/** 어드민 선택지에 보이는 색 이름. 색상환 순서로 보여준다. */
export const projectToneLabel: Record<ProjectTone, string> = {
  red: "빨강",
  orange: "주황",
  amber: "황토",
  brown: "갈색",
  lime: "연두",
  green: "초록",
  teal: "청록",
  cyan: "바다",
  blue: "파랑",
  indigo: "남색",
  violet: "보라",
  purple: "자주",
  pink: "분홍",
  slate: "회색",
};

/** 이름의 첫 글자. 머리글의 모노그램에 쓴다. 영문은 대문자로 바꾼다. */
export function monogram(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "";
}
