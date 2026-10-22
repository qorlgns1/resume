# 아키텍처

## 1. 선택한 버전과 실행 환경

2026-10-22 기준으로 npm 레지스트리와 공식 문서(peer dependency, engines)를 확인해 정했습니다. canary, beta, rc 버전은 쓰지 않았고, 모든 의존성은 정확한 버전으로 고정했습니다. 잠금 파일은 `pnpm-lock.yaml`입니다.

| 항목              | 버전             | 비고                                                                                          |
| ----------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| Node.js           | 24.x             | Docker 이미지 `node:24-alpine`. Next 16(>=20.9), Vite 8(>=20.19/22.12)과 호환                 |
| pnpm              | 10.33.0          | `packageManager`에 고정                                                                       |
| Turborepo         | 2.11.10          |                                                                                               |
| TypeScript        | **6.0.3**        | 7.0.2(Go 구현)가 최신이지만 Next/Storybook 도구 체인과의 호환을 아직 확인하지 않아 6.0을 사용 |
| Next.js           | 16.4.2           | web·admin 모두 App Router, Turbopack 빌드                                                     |
| React / React DOM | 19.3.1           |                                                                                               |
| Tailwind CSS      | 4.3.3            | `@tailwindcss/postcss`(Next), `@tailwindcss/vite`(Storybook)                                  |
| shadcn CLI        | 4.22.1           | new-york 스타일, `radix-ui` 1.8.1 통합 패키지                                                 |
| Zod               | 4.6.7            |                                                                                               |
| Storybook         | 10.6.3           | `@storybook/react-vite` + Vite 8.3.5, addon-docs, addon-a11y                                  |
| Biome             | 2.6.2            | 린트 + 포맷. `next`, `react` 도메인 규칙 사용                                                 |
| Playwright        | 1.64.1           | 스모크 검증 전용                                                                              |
| Pretendard        | 1.3.9            | variable dynamic subset                                                                       |
| better-sqlite3    | 13.0.3           | SQLite 3.53. 패키지에 플랫폼별 바이너리(glibc·musl 포함)가 들어 있어 설치 시 빌드하지 않음    |
| Drizzle ORM / Kit | 0.45.4 / 0.31.11 | 스키마·마이그레이션. 1.0은 아직 RC라 0.45 사용                                                |
| Better Auth       | 1.7.12           | 아이디 + 비밀번호(username 플러그인), Drizzle 어댑터                                          |

**ESLint 대신 Biome를 쓴 이유:** `eslint-config-next`가 쓰는 플러그인 일부(react, import, jsx-a11y)가 ESLint 10을 peer로 허용하지 않고, typescript-eslint는 TypeScript `<6.1`만 지원합니다. 그래서 소유자와 협의해 린트와 포맷을 한 도구로 처리하는 Biome를 택했습니다. 타입 정보가 필요한 규칙의 빈자리는 각 패키지의 `tsc --noEmit`으로 보완합니다.

## 2. 패키지 경계

```
apps/web ──────┐
apps/admin ────┼──> @resume/modules ──> @resume/ui ──> @resume/tokens
apps/storybook ┘          │
                          └──> @resume/contracts (zod)
```

- **contracts**: Zod 스키마, 타입, 순수 함수(배치 계산, 참조 검사), 샘플 데이터(`@resume/contracts/samples`)를 둡니다. Node 전용 API, 비밀 정보, DB 클라이언트는 넣지 않습니다.
- **ui**: 범용 컴포넌트(Button 등)입니다. 포트폴리오 도메인을 모릅니다.
- **modules**: 포트폴리오 모듈(자기소개 카드 등)과 벤토 그리드입니다. 공개 사이트와 어드민 미리보기가 같은 렌더러를 씁니다. 훅을 쓰지 않아 서버 컴포넌트에서도 렌더링됩니다.
- **앱 간 import 금지.** 공유가 필요하면 packages로 옮깁니다.
- 패키지는 빌드 산출물 없이 TypeScript 소스를 `exports`로 내보냅니다. Next는 `transpilePackages`로, Storybook은 Vite로 컴파일합니다.

## 3. 데이터 모델 (잠정)

[`packages/contracts/src`](../packages/contracts/src)에 정의했습니다.

```
SiteDocument (버전 관리 단위: 콘텐츠 + 배치를 함께 저장)
├─ site: SiteSettings          제목, 내비게이션, 푸터
├─ content: ContentLibrary     원본 콘텐츠 — 여러 페이지가 ID로 공유
│   ├─ profile (+ principles)
│   ├─ projects[]  고정 메타데이터 + body: Block[] (노션형 블록)
│   ├─ companies[] 회사별 경험 + body: Block[]
│   ├─ achievements[]
│   ├─ techStack[]
│   └─ history.chapters[]  챕터 + 타임라인 항목 (회사·프로젝트 참조 또는 직접 작성)
└─ pages: Page[]
    ├─ kind: system(home/projects/experience/history) | custom(slug)
    ├─ modules: ModuleInstance[]   id(안정적) · type · label · props · style
    └─ layout
        ├─ desktop: 12칼럼 {moduleId, col, colSpan, row, rowSpan}
        └─ mobile: 2칼럼 {strategy: auto|custom, items: [{moduleId, order, span, hidden, style 덮어쓰기}]}
```

설계 원칙:
- **원본 콘텐츠와 모듈 인스턴스 분리.** 예를 들어 홈에는 같은 `projects` 타입 인스턴스가 두 개 있습니다. 하나는 대표 프로젝트 1개를 크게 보여주고, 다른 하나는 1~3개 목록입니다. 둘 다 같은 프로젝트를 ID로 참조합니다.
- **콘텐츠는 공유하고 배치는 화면별로 분리.** 모바일은 기본적으로 데스크톱 읽기 순서(row → col)를 따라 자동으로 쌓입니다. 순서, 너비, 숨김, 스타일은 모바일에서 따로 덮어쓸 수 있습니다.
- **실행 가능한 문자열을 저장하지 않음.** 날짜는 `YYYY-MM`, 스타일은 enum, 링크는 `/`, `#`, `http(s)`, `mailto:`만 허용합니다. 본문은 HTML이 아닌 블록 JSON입니다.
- **스키마 수준 무결성.** 중복 ID, 배치 누락, 칼럼 초과, 겹침, 존재하지 않는 콘텐츠 참조를 Zod `superRefine`으로 거부합니다.
- 홈의 개인 프로젝트 목록은 1~3개입니다 (`MAX_HOME_PROJECTS`).
- `Draft`와 `PublishedVersion` 타입은 초안·게시·복원 흐름의 계약입니다. 실제 저장은 아래 "저장소"를 보세요.

## 3-1. 저장소 (SQLite, 어드민 전용)

- 파일 하나: `DATABASE_PATH` (개발 `apps/admin/data/resume.db`, Docker `/data/resume.db`). WAL 모드, 외래 키 사용.
- 스키마: [`apps/admin/src/server/db/schema.ts`](../apps/admin/src/server/db/schema.ts), 마이그레이션: `apps/admin/drizzle/`
  - 스키마를 바꾸면 `pnpm --filter @resume/admin db:generate`로 SQL을 만듭니다. 서버와 CLI는 DB를 열 때 미적용 마이그레이션을 자동으로 적용합니다.
  - 이미 커밋한 마이그레이션 파일은 수정하거나 다시 생성하지 않습니다. 기존 DB에서 같은 변경이 다시 실행되어 어드민이 시작하지 못합니다.
- **문서 스냅샷 방식**
  - `site_draft`: 편집 중인 `SiteDocument` JSON 1행 (`base_version`, 덮어쓰기 충돌 방지용 `revision`)
  - `published_versions`: 게시할 때마다 1행 (`version`, `document`, `note`, `restored_from`)
  - 읽고 쓸 때 항상 `SiteDocumentSchema`로 검증합니다. 저장된 JSON이 계약과 다르면 오류를 냅니다.
- 첫 시작 시 DB가 비어 있으면 샘플 문서로 초안과 게시 버전 1을 만듭니다 (`instrumentation-node.ts`).
- DB 접근은 `apps/admin/src/server`에만 있습니다. contracts·modules·web은 DB를 모릅니다.

## 3-2. 인증 (어드민 전용)

- Better Auth, 관리자 1명, 아이디 + 비밀번호. 설정: [`apps/admin/src/server/auth/config.ts`](../apps/admin/src/server/auth/config.ts)
- 웹 가입은 닫혀 있습니다(`disableSignUp`, `/sign-up/email` 비활성). 계정은 서버 CLI로만 만듭니다.
  - `admin:create`: 계정이 이미 있으면 거부. 내부 어댑터로 사용자와 비밀번호 계정을 만듦
  - `admin:reset-password`: 비밀번호를 바꾸고 모든 세션을 끊음
  - Docker 이미지에는 esbuild로 묶은 `cli.mjs`가 들어 있습니다.
- 비밀번호는 10~128자, scrypt 해시. 로그인 시도는 같은 IP에서 1분에 5번까지 (메모리 저장, 프로세스 1개 기준).
- 세션 쿠키: HttpOnly, SameSite=Lax, HTTPS일 때 Secure. 7일 유지, 하루에 한 번 연장.
- 보호 방식: `proxy.ts`가 쿠키가 없으면 `/login`으로 보내고(빠른 확인), 각 페이지는 `requireSession()`으로 세션을 DB에서 검증합니다.
  공개 경로: `/login`, `/api/auth/*`, `/api/public/*`, `/api/health`.
- 필수 설정: 운영 모드에서 `AUTH_SECRET`(32자 이상)과 `ADMIN_URL`이 없으면 서버가 시작하지 않고 종료합니다.

## 4. 벤토 그리드와 반응형

- 그리드는 viewport 미디어 쿼리가 아니라 **container query**(`rs-bento`, 48rem 기준)로 데스크톱 12칼럼과 모바일 2칼럼을 전환합니다.
  어드민 미리보기에서 프레임 폭만 1440이나 390으로 바꾸면 해당 화면의 배치가 그대로 재현됩니다.
- 모듈 스타일 enum은 `moduleStyleVars()`가 `--mod-*-d`(데스크톱)와 `--mod-*-m`(모바일) CSS 변수로 바꿉니다. CSS는 컨테이너 폭에 따라 둘 중 하나를 고릅니다.
- DOM 순서는 데스크톱 읽기 순서를 따릅니다. 모바일 `custom` 순서는 CSS `order`로 바꾸므로 화면 순서와 읽기 순서가 달라질 수 있습니다. 편집 UI에서 이 점을 안내해야 합니다.

## 5. API와 데이터 흐름

```
브라우저 ──> web (Next 서버) ──[CONTENT_SOURCE=api]──> admin  GET /api/public/v1/pages/{key}
                   │
                   └──[CONTENT_SOURCE=sample]──> @resume/contracts/samples
```

- 공개 사이트의 데이터 접근 지점은 `apps/web/src/lib/content/get-page.ts` 하나입니다 (`server-only`).
- 응답은 항상 `PublicPageResponseSchema`로 검증합니다. 실패 종류(`config`, `network`, `timeout`, `http`, `invalid-response`, `not-found`)는 결과 타입으로 돌려주고, 화면은 오류 상태를 렌더링합니다.
- `connection()`으로 요청 시점에 렌더링합니다. 그래서 빌드에 어드민 API나 환경 변수가 필요하지 않습니다. 캐시와 재검증(ISR, 게시 웹훅)은 게시 흐름을 설계할 때 정합니다.
- 어드민 API 응답: `{ schemaVersion: 1, data: { site, page, content }, meta: { source: "sample" | "published", generatedAt, version? } }`
  - 어드민은 DB의 **가장 최근 게시본**으로 응답합니다 (`source: "published"`). 초안은 공개 API로 노출하지 않습니다.
  - `source: "sample"`은 공개 사이트의 샘플 모드에서만 씁니다.
  - `content`는 지금 전체 라이브러리를 담습니다. 페이지가 참조하는 항목만 담도록 줄일 수 있습니다.
- 관리자 API (`apps/admin/src/app/api/admin`, 계약: `packages/contracts/src/versioning.ts`)

  | 메서드 | 경로                              | 동작                                                                                         | 주요 오류             |
  | ------ | --------------------------------- | -------------------------------------------------------------------------------------------- | --------------------- |
  | GET    | `/api/admin/draft`                | 초안 상태 (`document`, `revision`, `latestVersion`, `hasUnpublishedChanges`, `restoredFrom`) | 401                   |
  | PUT    | `/api/admin/draft`                | 초안 저장 `{ revision, document }`                                                           | 400 검증, 409 충돌    |
  | POST   | `/api/admin/publish`              | 초안을 새 버전으로 게시 `{ revision, note? }`                                                | 409, 422 바뀐 것 없음 |
  | GET    | `/api/admin/versions`             | 버전 목록 (최신순, 본문 제외)                                                                | 401                   |
  | POST   | `/api/admin/versions/{n}/restore` | 버전 n을 초안으로 가져옴 (게시하지 않음) `{ revision }`                                      | 404, 409              |
  - 모든 핸들러는 `withAdmin()`을 거칩니다: 세션을 DB에서 검증(없으면 401), GET 외 요청은 `Origin`이 `ADMIN_URL`과 같아야 함(아니면 403, CSRF 방어).
  - 초안을 바꾸는 요청은 클라이언트가 본 `revision`을 함께 보냅니다. 서버 값과 다르면 다른 탭·기기에서 먼저 바꾼 것이므로 409로 거부합니다(낙관적 잠금).
  - 문서는 저장 전에 `SiteDocumentSchema`로 다시 검증합니다. 페이지 ID 중복, 존재하지 않는 콘텐츠 참조, 홈 페이지 누락도 거부합니다.

## 5-1. 어드민 편집 화면

- 상태: 서버에 저장된 초안(`saved`)과 화면의 작업본(`document`)을 따로 둡니다. 둘이 다르면 "저장하지 않은 변경"입니다.
- 작업본은 바뀔 때마다 `SiteDocumentSchema`로 검사하고, 오류는 문서 경로(예: `pages.0.modules.3.props.heading`)로 해당 입력칸에 표시합니다. 오류가 있으면 저장할 수 없습니다. 오류 문구는 `configureKoreanErrors()`로 한국어로 바꿉니다.
- 미리보기는 공개 사이트와 같은 `BentoGrid`로 작업본을 그립니다.
- 모듈 인스턴스 설정(오른쪽 패널의 콘텐츠·스타일·배치)과 원본 콘텐츠 편집(왼쪽 "콘텐츠" 탭)을 구분합니다. 원본을 고치면 그것을 참조하는 모든 모듈에 반영됩니다.
- 새 모듈 기본값은 `@resume/modules`의 `createModuleDraft()`가 만듭니다. 연결할 원본 콘텐츠가 없으면 이유를 알려주고 추가하지 않습니다.
- 성공 안내는 서버 응답을 받은 뒤에만 표시합니다.

## 6. 배포와 실행 주소

| 실행 방식      | web → admin (서버 간)               | 브라우저 → web                 | 브라우저 → admin                 |
| -------------- | ----------------------------------- | ------------------------------ | -------------------------------- |
| 로컬 dev       | `http://localhost:3001`             | `http://localhost:3000`        | `http://localhost:3001`          |
| Docker Compose | `http://admin:3001` (내부 네트워크) | `http://localhost:${WEB_PORT}` | `http://localhost:${ADMIN_PORT}` |

`ADMIN_URL`은 마지막 열(브라우저 → admin) 주소여야 합니다.
- Docker: `turbo prune --docker`로 앱별 작업 공간을 만들고, `NEXT_OUTPUT=standalone`으로 빌드합니다. `outputFileTracingRoot`를 모노레포 루트로 지정해 `packages/*` 파일도 추적에 포함합니다. 실행 이미지에는 standalone 서버, static, public만 담고 비루트 사용자로 실행합니다.
- Vercel: Root Directory를 `apps/web`로 지정합니다. standalone 출력은 사용하지 않습니다 (README 참고).
- 어드민 이미지: `/data` 볼륨(DB·업로드), `MIGRATIONS_DIR`, 계정 CLI `cli.mjs`를 포함합니다. CLI가 standalone 안의 `better-sqlite3`를 찾도록 `apps/admin/node_modules`에 링크를 둡니다.
- 어드민은 로그인으로 보호되지만, HTTPS 리버스 프록시 안내가 나오기 전까지는 외부에 노출하지 않습니다 (`robots` noindex, compose 포트는 127.0.0.1에만 바인딩).
