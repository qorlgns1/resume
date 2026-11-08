/*
 * 답을 소리 내어 읽는 데 걸리는 시간 어림.
 * 면접에서 또박또박 말하는 한국어는 1분에 약 270음절(초당 4.5)로 잡는다.
 * 공백과 문장 부호는 세지 않고, 한글 음절·영문자·숫자를 한 글자씩 센다.
 * (영단어는 실제로 더 빨리 읽지만, 어림이라 단순하게 둔다.)
 */

const SYLLABLES_PER_SECOND = 4.5;

/** 말로 읽는 글자 수 */
export function spokenLength(text: string): number {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

/** 읽는 데 걸리는 시간(초), 5초 단위로 반올림 */
export function speakingSeconds(text: string): number {
  const length = spokenLength(text);
  if (length === 0) return 0;
  return Math.max(5, Math.round(length / SYLLABLES_PER_SECOND / 5) * 5);
}

/** "약 40초", "약 1분 10초" */
export function formatSpeakingTime(text: string): string | null {
  const seconds = speakingSeconds(text);
  if (seconds === 0) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `약 ${rest}초`;
  return rest === 0 ? `약 ${minutes}분` : `약 ${minutes}분 ${rest}초`;
}
