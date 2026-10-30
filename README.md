# Resume — 셀프 호스팅 포트폴리오

관리자 화면에서 페이지 콘텐츠와 모듈 배치를 편집하는 오픈소스 포트폴리오입니다.
저장소를 복제해 자신의 서버에 설치하고, 공개 사이트와 어드민을 따로 배포하는 것을 목표로 합니다.

> **현재 단계: 편집·게시, 상세 페이지, 이미지.** 어드민에서 콘텐츠·모듈·배치·본문·히스토리·이미지를 편집하고, 초안 저장 → 게시 → 버전 복원까지 할 수 있습니다. 공개 사이트는 게시본으로 홈, 프로젝트·회사 목록과 상세, 히스토리, 소개를 보여줍니다.
> HTTPS 구성 안내 전까지 어드민은 **로컬 검토용**으로만 실행하세요.

## 구성

| 경로                 | 이름                | 역할                                                 |
| -------------------- | ------------------- | ---------------------------------------------------- |
| `apps/web`           | `@resume/web`       | 공개 포트폴리오 (Next.js App Router)                 |
| `apps/admin`         | `@resume/admin`     | 어드민 화면 + 공개 콘텐츠 API                        |
| `apps/storybook`     | `@resume/storybook` | 토큰·공통 UI·모듈 확인                               |
| `packages/tokens`    | `@resume/tokens`    | CSS 변수 디자인 토큰, Tailwind 테마 매핑, Pretendard |
| `packages/ui`        | `@resume/ui`        | shadcn/ui 기반 공통 UI                               |
| `packages/modules`   | `@resume/modules`   | 포트폴리오 모듈 렌더러, 벤토 그리드                  |
| `packages/contracts` | `@resume/contracts` | Zod 스키마·타입, 샘플 데이터 (브라우저 안전 코드만)  |
| `packages/config`    | `@resume/config`    | 공통 TypeScript 설정                                 |

앱끼리는 서로의 소스를 import하지 않고 `packages/*`로만 공유합니다. 자세한 내용은 [docs/architecture.md](docs/architecture.md)를 보세요.

## 요구 환경

- Node.js **24.x** (`.nvmrc`)
- pnpm **10.33.0** (`packageManager`에 고정. `corepack enable`로 자동 사용)
- Docker 29 / Docker Compose v2 이상 (Docker 실행 시)

## 설치

```bash
corepack enable
pnpm install
```

## 실행

| 앱          | 명령                 | 주소                  |
| ----------- | -------------------- | --------------------- |
| 공개 사이트 | `pnpm dev:web`       | http://localhost:3200 |
| 어드민      | `pnpm dev:admin`     | http://localhost:3201 |
| Storybook   | `pnpm dev:storybook` | http://localhost:6006 |
| 전부        | `pnpm dev`           | 위 주소 모두          |

각 앱의 `.env.example`을 `.env.local`로 복사해 설정을 바꿀 수 있습니다. 설정하지 않아도 개발 기본값으로 실행됩니다.

### 어드민 처음 실행하기

어드민은 처음 시작할 때 `apps/admin/data/resume.db`를 만들고, 샘플 콘텐츠로 초안과 첫 게시본(버전 1)을 채웁니다.
로그인하려면 관리자 계정을 **서버에서 명령으로** 만들어야 합니다. 웹 가입은 없습니다.

```bash
pnpm --filter @resume/admin admin:create          # 아이디와 비밀번호 입력 (관리자는 1명)
pnpm --filter @resume/admin admin:reset-password  # 비밀번호를 잊었을 때 (모든 로그인 세션도 끊음)
```

| 어드민 환경 변수  | 설명                                                            | 개발 기본값                                |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `ADMIN_URL`       | 브라우저가 접속하는 어드민 주소. 로그인 요청의 출처 검사에 사용 | `http://localhost:3201` (운영 필수)        |
| `AUTH_SECRET`     | 세션 서명 키, 32자 이상. `openssl rand -base64 32`              | 개발용 고정값 (운영 필수)                  |
| `DATABASE_PATH`   | SQLite 파일 경로                                                | `./data/resume.db`                         |
| `MEDIA_DIR`       | 업로드 이미지 폴더                                              | DB 파일 옆 `media/` (Docker `/data/media`) |
| `PUBLIC_SITE_URL` | 상단 "공개 사이트" 링크 주소                                    | 없음                                       |

운영 모드(`next start`, Docker)에서 `ADMIN_URL`이나 `AUTH_SECRET`이 없으면 어드민은 시작하지 않고 종료합니다.

## 빌드

```bash
pnpm build            # 전체 (web, admin, storybook)
pnpm build:web        # 공개 사이트만
pnpm build:admin      # 어드민만
pnpm build:storybook  # Storybook만 → apps/storybook/storybook-static
```

빌드 결과 실행: `pnpm --filter @resume/web start`, `pnpm --filter @resume/admin start` (어드민은 `apps/admin/.env.local`에 `ADMIN_URL`, `AUTH_SECRET` 필요)

공통 패키지는 따로 빌드하지 않습니다. 각 Next 앱이 `transpilePackages`로 TypeScript 소스를 함께 컴파일하므로, 앱 하나만 빌드해도 필요한 패키지가 포함됩니다.

## 콘텐츠 출처: 샘플 모드와 API 모드

공개 사이트는 `CONTENT_SOURCE` 환경 변수로 데이터 출처를 **명시적으로** 고릅니다.

| 모드        | 설정                                                            | 동작                                                                                           |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 샘플 (기본) | `CONTENT_SOURCE=sample`                                         | 저장소의 샘플 데이터를 계약 스키마로 검증해 렌더링합니다. 어드민 없이 실행·빌드할 수 있습니다. |
| API         | `CONTENT_SOURCE=api`<br>`CONTENT_API_URL=http://localhost:3201` | 서버에서 어드민의 `GET /api/public/v1/pages/{key}`를 호출하고 응답을 검증합니다.               |
- API 호출이 실패하면 샘플로 몰래 바꾸지 않고 **오류 화면**을 보여줍니다 (연결 실패, 시간 초과, HTTP 오류, 계약 불일치를 구분).
- 모든 설정은 서버에서만 읽습니다 (`NEXT_PUBLIC_` 없음). 브라우저에 API 주소가 노출되지 않습니다.
- 페이지는 요청 시점에 렌더링합니다. 그래서 빌드 단계는 어드민 API에 의존하지 않고, 같은 빌드 결과를 어느 모드로든 실행할 수 있습니다.
- API는 어드민 DB의 **가장 최근 게시본**을 돌려줍니다 (`meta.source: "published"`, `meta.version`). 초안은 노출하지 않습니다.
- 게시본이 아직 저장소의 샘플 콘텐츠라면 공개 사이트에 "샘플 데이터" 안내가 표시됩니다.

```bash
# 예: API 모드로 로컬 실행
pnpm dev:admin
CONTENT_SOURCE=api CONTENT_API_URL=http://localhost:3201 pnpm dev:web
```

## 방문 분석 (선택)

공개 사이트에 [PostHog](https://posthog.com)를 연결해 방문자가 어떤 페이지를 어떤 순서로 보는지 확인할 수 있습니다. 기본으로 꺼져 있고, `apps/web` 실행 환경에 `POSTHOG_KEY`를 넣으면 켜집니다. 어드민은 추적하지 않습니다.

| 공개 사이트 환경 변수 | 설명                                                     | 기본값                     |
| --------------------- | -------------------------------------------------------- | -------------------------- |
| `POSTHOG_KEY`         | PostHog 프로젝트 키 (`phc_...`, 공개용 값). 비우면 꺼짐  | 없음                       |
| `POSTHOG_HOST`        | PostHog 주소. 유럽 클라우드는 `https://eu.i.posthog.com` | `https://us.i.posthog.com` |
- 페이지 이동(`$pageview`), 떠남(`$pageleave`, 머문 시간·스크롤 깊이), 클릭(`$autocapture`, 링크 주소 포함)을 자동으로 기록합니다. 이동 순서는 PostHog의 **Paths**에서 봅니다.
- 세션 녹화와 히트맵은 PostHog 프로젝트 설정에서 켭니다.
- 내 방문 제외: 사이트를 `/?ph_internal=1`로 한 번 열면 그 브라우저의 이벤트에 `internal_visit`가 붙습니다. PostHog 프로젝트의 테스트 계정 필터에 `internal_visit` 이벤트 속성이 "is not set"인 조건을 넣어 두면 "Filter out internal and test users"를 켠 화면에서 빠집니다. 기기·브라우저마다 한 번씩 엽니다. `localhost` 방문은 자동으로 내부 사용자입니다.
- 지원 경로 구분: 링크에 `?utm_source=wanted&utm_campaign=회사명`처럼 꼬리표를 붙이면 PostHog가 방문 전체를 그 꼬리표로 묶습니다.
- 방문자 ID(무작위 값)를 브라우저 localStorage에 저장해 다시 찾아온 방문자를 알아봅니다. 쿠키는 쓰지 않습니다. 기기에 값을 저장하므로 운영 지역의 개인정보 규정에 따라 안내 문구가 필요할 수 있습니다.
- 브라우저가 PostHog로 바로 보내므로, 광고 차단기를 쓰는 방문자는 기록되지 않습니다.

## Storybook

```bash
pnpm dev:storybook     # 개발 서버
pnpm build:storybook   # 정적 빌드
```

`Foundations/Tokens`(색상·타이포그래피·간격·모서리), `UI/*`(상태별 공통 컴포넌트), `Modules/*`(모듈, 프로젝트 1·2·3개 상태, 홈 전체 1440/390)를 확인할 수 있습니다.

## Docker

```bash
cp .env.example .env        # AUTH_SECRET 채우기: openssl rand -base64 32
docker compose up --build
docker compose exec -it admin node cli.mjs create   # 관리자 계정 만들기
# 공개 사이트 http://localhost:3000 (API 모드), 어드민 http://localhost:3001
```

- 포트가 이미 쓰이고 있다면 `.env`의 `WEB_PORT`, `ADMIN_PORT`를 바꿉니다.
- 비밀번호 재설정: `docker compose exec -it admin node cli.mjs reset-password`
- 데이터(SQLite DB와 업로드 이미지)는 `admin-data` 볼륨의 `/data`에 있습니다. `docker compose down`으로 컨테이너를 지워도 남고, `down -v`를 하면 지워집니다.
- 백업은 어드민을 멈춘 뒤(`docker compose stop admin`) `/data`를 복사합니다: `docker compose cp admin:/data ./backup`. 실행 중에 안전하게 백업하는 명령은 다음 단계에서 제공합니다.
- 컨테이너 안에서 web은 `http://admin:3001`로 어드민을 호출하고, 브라우저는 `localhost` 주소로 접속합니다. 두 주소를 섞지 마세요.
- compose는 두 포트를 `127.0.0.1`에만 엽니다 (어드민이 로컬 검토용이기 때문).
- 이미지를 따로 빌드할 때는 저장소 루트를 컨텍스트로 사용합니다.

  ```bash
  docker build -f apps/web/Dockerfile -t resume-web .
  docker run --rm -p 3000:3000 -e CONTENT_SOURCE=sample resume-web
  ```
- 비밀 정보는 이미지에 넣지 않습니다. `.dockerignore`가 `.env*` 파일을 제외하므로 실행할 때 환경 변수로 전달하세요.

## Vercel (apps/web)

실제 배포는 하지 않았습니다. 설정 방법만 정리합니다.
1. 새 프로젝트에서 이 저장소를 고르고 **Root Directory = `apps/web`** 으로 지정합니다.
2. Framework Preset은 Next.js, Install/Build 명령은 기본값을 사용합니다. Vercel이 pnpm 워크스페이스를 인식해 저장소 루트에서 설치합니다.
3. "Include files outside the root directory in the Build Step" 옵션을 켜 둡니다 (기본값). `packages/*`를 함께 컴파일하기 위해 필요합니다.
4. 환경 변수: `CONTENT_SOURCE=sample`. 어드민을 따로 배포한 뒤에는 `CONTENT_SOURCE=api`와 `CONTENT_API_URL`을 지정합니다. 방문 분석을 쓰려면 `POSTHOG_KEY`도 넣습니다.
5. `NEXT_OUTPUT`은 설정하지 않습니다. standalone 출력은 Docker에서만 사용합니다.

## 검증

```bash
pnpm lint          # Biome (린트 + 포맷 검사)
pnpm typecheck     # 모든 패키지·앱 tsc
pnpm build         # web, admin, storybook 빌드
pnpm test:smoke:install   # 처음 한 번: Playwright Chromium 설치
pnpm test:smoke    # 빌드 결과물로 스모크 검증 (31xx 포트 사용)
```

스모크 검증은 다음을 확인합니다.
- 공개 API 응답(DB 게시본)의 계약
- 홈 화면 1440px / 390px (스크린샷: `test-results/screens`)
- 메뉴의 키보드 동작, Escape 닫기, 포커스 복원, 스크롤 잠금, reduced-motion
- API 모드 렌더링과 API 실패 시 오류 화면
- 어드민 로그인: 미로그인 차단, 오입력 오류, 로그인·로그아웃, 웹 가입 차단, 로그인 시도 제한
- 이미지: 메타데이터 제거·회전, SVG·큰 파일 거부, 커버 선택 → 게시 → `/media` 표시, 사용 중 삭제 차단
- 목록·상세·히스토리: 상세 이동과 돌아가기, 없는 주소 404, 히스토리 링크, 히스토리 편집 → 게시 → 반영
- 어드민 편집: 잘못된 값 표시와 저장 차단, 편집 → 저장 → 게시 → 공개 사이트 반영, 이전 버전 복원·게시, 모듈 추가·삭제, 동시 편집 충돌 알림
- 관리자 API 보호: 미로그인 401, 다른 출처 403, 잘못된 문서 400

스모크 검증은 매번 `test-results/smoke-data`에 빈 DB를 만들고 CLI로 테스트 계정을 생성합니다.

## 현재 구현 범위

**구현됨**
- pnpm + Turborepo 모노레포, Biome, 공통 tsconfig
- CSS 변수 토큰 → Tailwind v4 테마, Pretendard, 명도 대비 확인
- shadcn/ui 기반 공통 UI: Button, Input, Textarea, Label, Select, Tabs, Badge, Card, Dialog, Sheet, Tooltip, Field, Empty
- 모듈 6종(자기소개, 대표 프로젝트, 성과, 기술 스택, 현재 상태, 히스토리 진입부)과 12칼럼 / 모바일 2칼럼 벤토 그리드
- 공개 사이트: 벤토 홈, 개인 프로젝트 목록·상세(`/projects/[slug]`), 회사 경험 목록·상세(`/experience/[slug]`), 챕터·타임라인 히스토리, 소개(`/about`, 프로필의 소개 본문), 오른쪽 슬라이드 메뉴
- 어드민 편집 화면: 페이지·모듈 선택, 데스크톱/모바일 미리보기(입력 즉시 반영), 모듈 콘텐츠·스타일·배치(12칼럼 숫자, 모바일 순서·너비·숨김·스타일) 편집, 모듈 추가·삭제
- 원본 콘텐츠 편집: 사이트 정보, 프로필, 프로젝트, 회사, 성과, 기술 스택 (사용 중인 항목은 삭제 차단)
- 프로젝트·회사 상세 본문 편집: 노션형 블록 편집기(BlockNote, `/` 메뉴, 블록 드래그, 3단계 중첩 목록)
- 히스토리 편집: 챕터 추가·삭제·순서 변경, 항목을 회사·프로젝트에 연결하거나 직접 작성
- 이미지: 프로젝트 커버와 본문 이미지 업로드. 위치 정보(EXIF) 제거, 회전 반영, 너비별 WebP 변환(원본 미보관), SVG·10MB 초과 거부, 사용 중 이미지 삭제 차단, 공개 사이트는 `/media`로 전달
- 초안 저장(동시 편집 충돌 방지, Ctrl/⌘+S), 게시(메모), 버전 기록과 복원, 저장하지 않고 떠날 때 경고, 한국어 검증 오류
- SQLite 저장소(Drizzle 마이그레이션, 초안·게시본 문서, 첫 실행 시 샘플 채우기)
- 관리자 로그인(Better Auth, 아이디 + 비밀번호, 웹 가입 차단, 시도 제한), 계정 생성·재설정 CLI
- 공개 API가 DB 게시본 제공, 응답 계약 검증, 공개 사이트 샘플/API 모드 분리
- 앱별 Dockerfile, 데이터 볼륨을 쓰는 로컬 Docker Compose, `.env.example`
- 선택형 방문 분석(PostHog): 페이지 이동 경로, 클릭, 재방문 식별

**아직 없음**
- 드래그로 모듈 이동·크기 변경 (지금은 숫자와 버튼으로 조정)
- 미디어 업로드·저장소
- HTTPS·리버스 프록시 구성 안내, 2단계 인증·패스키
- 사용자 페이지 추가

다음 작업은 [docs/next-steps.md](docs/next-steps.md)에 정리했습니다.

## 디자인 기준

공개 사이트는 크기가 다른 카드를 정돈된 그리드로 배치하는 벤토 카드 레이아웃을 사용합니다. 배경 #F2F3F5, 흰 카드, 강조색 #2F6BFF, 어두운 카드 #1C1D21, Pretendard 서체가 기본입니다.
저장소에 들어 있는 인물·회사·프로젝트·수치는 모두 "샘플"로 표시한 가상 콘텐츠입니다. 자세한 내용은 [docs/design-system.md](docs/design-system.md)를 보세요.

## 라이선스

[MIT](LICENSE) © 2026 KIHOON BAE

라이선스는 이 저장소의 **코드**에만 적용됩니다. 설치한 사람이 어드민에 입력하는 경력, 글, 사진 등의 콘텐츠는 각 작성자의 것이며 이 라이선스에 포함되지 않습니다. 저장소의 샘플 콘텐츠는 가상의 예시입니다.

사용한 서체 Pretendard는 [SIL Open Font License 1.1](https://github.com/orioncactus/pretendard/blob/main/LICENSE)을 따릅니다.
