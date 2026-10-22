# 디자인 시스템

## 기준

- 공개 사이트는 크기가 다른 카드를 12칼럼 그리드에 정돈한 **벤토 카드 레이아웃**을 기본 디자인으로 사용합니다.
  - 홈 기본 구성: 대표 소개 + 어두운 대표 프로젝트 카드, 일하는 방식, 개인 프로젝트 1~3개, 문제 해결 경험, 기술 스택, 현재 상태, 지나온 경험
  - 저장소의 콘텐츠는 모두 가상의 샘플이며 카드마다 "샘플" 배지를 붙입니다. 제품 이미지가 없을 때는 회색 막대로 된 "예시 화면" 자리 표시를 보여줍니다.
- 주요 확인 화면은 데스크톱 1440px와 모바일 390px입니다.
- 전체 테마 전환은 없습니다. 모듈 단위로 배경, 글자 크기, 정렬, 여백, 테두리만 정해진 선택지 안에서 바꿉니다.

## 토큰 (`@resume/tokens`)

원천은 [`tokens.css`](../packages/tokens/src/tokens.css)의 `--rs-*` CSS 변수입니다. [`theme.css`](../packages/tokens/src/theme.css)가 이 변수를 Tailwind v4 테마(`@theme inline`)로 연결합니다.

| 역할               | 토큰                         | 값                          | Tailwind                                                               |
| ------------------ | ---------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| 페이지 배경        | `--rs-color-canvas`          | #F2F3F5                     | `bg-canvas`                                                            |
| 기본 카드          | `--rs-color-surface`         | #FFFFFF                     | `bg-card`, `bg-background`                                             |
| 어두운 카드        | `--rs-color-surface-inverse` | #1C1D21                     | `bg-inverse`                                                           |
| 강조색             | `--rs-color-primary`         | #2F6BFF                     | `bg-primary`                                                           |
| 작은 링크 텍스트   | `--rs-color-primary-text`    | #1F58E6                     | `text-primary-text`                                                    |
| 본문 / 보조 / 캡션 | `--rs-color-text*`           | #111214 / #4B5260 / #636A76 | `text-foreground` / `text-muted-foreground` / `text-subtle-foreground` |
- shadcn/ui 관례를 따르므로 **`primary`가 브랜드 강조색**이고, **`accent`는 옅은 hover 배경**입니다.
- `@theme inline`으로 매핑한 값은 런타임 CSS 변수로 남지 않습니다. 직접 CSS를 쓸 때는 `--rs-*`를 참조하세요.
- 서체는 Pretendard Variable(dynamic subset)입니다. 한글 제목은 자간 -0.025em, 본문은 `word-break: keep-all`입니다.
- 모서리: 4 / 6 / 10 / 14 / 18px. 벤토 카드는 18px입니다.
- 그림자는 카드용 `0 1px 2px` 수준만 씁니다. 그라데이션과 3D 장식은 쓰지 않습니다.
- `prefers-reduced-motion: reduce`에서는 모든 애니메이션과 전환을 사실상 끕니다.

### 명도 대비 (WCAG 2.1)

| 조합                                      | 대비                      |
| ----------------------------------------- | ------------------------- |
| 본문 #111214 / 캔버스                     | 16.9:1                    |
| 보조 텍스트 #4B5260 / 캔버스              | 7.1:1                     |
| 캡션 #636A76 / 캔버스                     | 4.9:1                     |
| 흰 글자 / 강조색 #2F6BFF                  | 4.5:1 (버튼, 굵은 글자)   |
| 작은 링크 #1F58E6 / 캔버스                | 5.3:1                     |
| 어두운 카드 보조 텍스트 #B8BCC5 / #1C1D21 | 8.9:1                     |
| 입력 경계선 #868D98 / 흰 배경             | 3.2:1 (비텍스트 3:1 기준) |

#2F6BFF는 회색 배경 위의 작은 글자에서 4.0:1이므로, 작은 링크에는 `primary-text`를 씁니다.

## 공통 UI (`@resume/ui`)

shadcn/ui(new-york, Radix 기반)로 생성한 뒤 토큰에 맞게 조정했습니다. 컴포넌트는 앱마다 복제하지 않고 이 패키지에서만 관리합니다.

| 컴포넌트                                         | 비고                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| Button                                           | 기본 hover는 `primary-hover`(대비 유지). `lg`는 44px 높이     |
| Input, Textarea, Label                           | `aria-invalid` 오류 스타일                                    |
| Field (FieldLabel/Description/Error/Set/Legend)  | 기본 폼 표현. FieldError는 `role="alert"`                     |
| Select, Tabs, Badge(+soft/success/warning), Card |                                                               |
| Dialog, Sheet                                    | Radix Dialog: 포커스 가두기, Escape, 포커스 복원, 스크롤 잠금 |
| Tooltip                                          | 앱 루트에 `TooltipProvider` 필요                              |
| Switch, Checkbox                                 | 어드민 편집 폼 (켜기/끄기, 참조 콘텐츠 선택)                  |
| Empty                                            | 빈 상태와 오류 상태                                           |

컴포넌트를 추가할 때는 다음 순서로 합니다.
1. `packages/ui`에서 `pnpm dlx shadcn@4.22.1 add <name>`을 실행합니다.
2. 생성된 import가 `#lib/utils`, `#components/*`인지 확인합니다. shadcn CLI 4.22.1은 `cn`을 `"cn"` 패키지에서 가져오도록 잘못 생성하고 `cn` 의존성을 추가하므로, import를 고치고 그 의존성을 지웁니다.
3. `dark:` 클래스를 지우고 토큰에 맞게 조정합니다.
4. Storybook에 스토리를 추가합니다.

## 공통 UI와 포트폴리오 모듈의 구분

- `Button`은 UI이고, 자기소개 카드는 **모듈**입니다.
- 모듈(`@resume/modules`)은 contracts 데이터를 받아 그립니다. 카드 프레임(`ModuleFrame`)이 스타일을 적용하고, 모듈 내부는 `.rs-fg-muted`, `.rs-type-*` 같은 모듈 변수 기반 클래스를 써서 배경(흰/어두운 카드)과 글자 크기 설정에 자동으로 맞춥니다.
- 모듈 안의 링크는 모두 `ModuleLink`를 거칩니다. 공개 사이트에서는 `next/link`로 이동하고, 어드민 미리보기에서는 이동하지 않는 텍스트(`inert`)로 렌더링합니다.

### 모듈 스타일 설정 (향후 편집 대상)

| 속성       | 선택지                                             |
| ---------- | -------------------------------------------------- |
| background | surface, muted, inverse, primary-soft, transparent |
| textScale  | sm(0.9), md(1), lg(1.12)                           |
| align      | start, center                                      |
| padding    | none, sm(16), md(24), lg(32)                       |
| border     | none, subtle, strong                               |

## Storybook

| 위치                    | 내용                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `Foundations/Tokens`    | 색상, 타이포그래피, 간격, 모서리                           |
| `UI/*`                  | 기본, 변형, 크기, disabled, focus, 오류, 열기·닫기(play)   |
| `Modules/Cards`         | 6종 모듈, 스타일 설정 예시                                 |
| `Modules/Projects Grid` | 개인 프로젝트 1·2·3개                                      |
| `Modules/Home Page`     | 홈 전체 (데스크톱 1440 / 모바일 390 viewport)              |
| `Modules/Block Content` | 상세 본문 렌더러: 모든 블록 종류, 3단계 중첩 목록, 빈 본문 |

실제로 구현한 컴포넌트만 등록했습니다. addon-a11y가 스토리마다 axe 검사를 실행합니다.
