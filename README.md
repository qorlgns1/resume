# Resume — 셀프 호스팅 포트폴리오

관리자 화면에서 페이지 콘텐츠와 모듈 배치를 편집하는 오픈소스 포트폴리오입니다.
저장소를 복제해 자신의 서버에 설치하고, 공개 사이트와 어드민을 따로 배포하는 것을 목표로 합니다.

> **현재 단계: 초기 기반.** 모노레포, 디자인 시스템, 공개 홈 샘플, 어드민 기본 화면, 읽기 전용 샘플 API까지만 구현했습니다.
> 저장·게시·인증·DB는 아직 없습니다. 어드민은 **로컬 검토용**이며 운영 서비스로 공개하면 안 됩니다.

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
| 공개 사이트 | `pnpm dev:web`       | http://localhost:3000 |
| 어드민      | `pnpm dev:admin`     | http://localhost:3001 |
| Storybook   | `pnpm dev:storybook` | http://localhost:6006 |
| 전부        | `pnpm dev`           | 위 주소 모두          |

각 앱의 `.env.example`을 `.env.local`로 복사해 설정을 바꿀 수 있습니다. 설정하지 않아도 기본값(샘플 모드)으로 실행됩니다.

## 빌드

```bash
pnpm build            # 전체 (web, admin, storybook)
pnpm build:web        # 공개 사이트만
pnpm build:admin      # 어드민만
pnpm build:storybook  # Storybook만 → apps/storybook/storybook-static
```

빌드 결과 실행: `pnpm --filter @resume/web start`, `pnpm --filter @resume/admin start`

공통 패키지는 따로 빌드하지 않습니다. 각 Next 앱이 `transpilePackages`로 TypeScript 소스를 함께 컴파일하므로, 앱 하나만 빌드해도 필요한 패키지가 포함됩니다.

## 콘텐츠 출처: 샘플 모드와 API 모드

공개 사이트는 `CONTENT_SOURCE` 환경 변수로 데이터 출처를 **명시적으로** 고릅니다.

| 모드        | 설정                                                            | 동작                                                                                           |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 샘플 (기본) | `CONTENT_SOURCE=sample`                                         | 저장소의 샘플 데이터를 계약 스키마로 검증해 렌더링합니다. 어드민 없이 실행·빌드할 수 있습니다. |
| API         | `CONTENT_SOURCE=api`<br>`CONTENT_API_URL=http://localhost:3001` | 서버에서 어드민의 `GET /api/public/v1/pages/{key}`를 호출하고 응답을 검증합니다.               |
- API 호출이 실패하면 샘플로 몰래 바꾸지 않고 **오류 화면**을 보여줍니다 (연결 실패, 시간 초과, HTTP 오류, 계약 불일치를 구분).
- 모든 설정은 서버에서만 읽습니다 (`NEXT_PUBLIC_` 없음). 브라우저에 API 주소가 노출되지 않습니다.
- 페이지는 요청 시점에 렌더링합니다. 그래서 빌드 단계는 어드민 API에 의존하지 않고, 같은 빌드 결과를 어느 모드로든 실행할 수 있습니다.
- 현재 API는 **샘플 데이터를 돌려주는 읽기 전용 API**이며 최종 저장 구조가 아닙니다.

```bash
# 예: API 모드로 로컬 실행
pnpm dev:admin
CONTENT_SOURCE=api CONTENT_API_URL=http://localhost:3001 pnpm dev:web
```

## Storybook

```bash
pnpm dev:storybook     # 개발 서버
pnpm build:storybook   # 정적 빌드
```

`Foundations/Tokens`(색상·타이포그래피·간격·모서리), `UI/*`(상태별 공통 컴포넌트), `Modules/*`(모듈, 프로젝트 1·2·3개 상태, 홈 전체 1440/390)를 확인할 수 있습니다.

## Docker

```bash
docker compose up --build
# 공개 사이트 http://localhost:3000 (API 모드), 어드민 http://localhost:3001
```

- 포트가 이미 쓰이고 있다면: `WEB_PORT=3200 ADMIN_PORT=3201 docker compose up --build`
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
4. 환경 변수: `CONTENT_SOURCE=sample`. 어드민을 따로 배포한 뒤에는 `CONTENT_SOURCE=api`와 `CONTENT_API_URL`을 지정합니다.
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
- API 샘플 응답의 계약
- 홈 화면 1440px / 390px (스크린샷: `test-results/screens`)
- 메뉴의 키보드 동작, Escape 닫기, 포커스 복원, 스크롤 잠금, reduced-motion
- API 모드 렌더링과 API 실패 시 오류 화면
- 어드민의 선택 상태, 미리보기 전환, 미구현 버튼

## 현재 구현 범위

**구현됨**
- pnpm + Turborepo 모노레포, Biome, 공통 tsconfig
- CSS 변수 토큰 → Tailwind v4 테마, Pretendard, 명도 대비 확인
- shadcn/ui 기반 공통 UI: Button, Input, Textarea, Label, Select, Tabs, Badge, Card, Dialog, Sheet, Tooltip, Field, Empty
- 모듈 6종(자기소개, 대표 프로젝트, 성과, 기술 스택, 현재 상태, 히스토리 진입부)과 12칼럼 / 모바일 2칼럼 벤토 그리드
- 공개 홈 샘플, 개인 프로젝트·회사 경험·히스토리 빈 상태 페이지, 오른쪽 슬라이드 메뉴
- 어드민 3단 레이아웃, 페이지·모듈 선택, 설정 패널(읽기 전용), 데스크톱/모바일 미리보기
- 읽기 전용 샘플 API, 응답 계약 검증, 샘플/API 모드 분리
- 앱별 Dockerfile, 로컬 Docker Compose, `.env.example`

**아직 없음**
- 콘텐츠·스타일 편집, 모듈 추가·삭제·드래그·크기 변경
- 초안 저장, 게시, 버전 기록·복원
- 관리자 인증, 데이터베이스, 미디어 업로드·저장소
- 프로젝트 상세(블록 본문), 회사 경험 목록·상세, 히스토리 타임라인 화면
- 사용자 페이지 추가

다음 작업은 [docs/next-steps.md](docs/next-steps.md)에 정리했습니다.

## 디자인 기준

공개 사이트는 벤토 카드 스타일의 C 시안([docs/home-c.png](docs/home-c.png))을 기준으로 만들었습니다. 카드 구성과 분위기를 참고했을 뿐, 이미지와 픽셀 단위로 같지는 않습니다.
시안의 인물·회사·수치는 옮기지 않았고, 모두 "샘플"로 표시한 가상 콘텐츠로 바꿨습니다. 자세한 내용은 [docs/design-system.md](docs/design-system.md)를 보세요.

## 라이선스

아직 정하지 않았습니다. 소유자가 라이선스를 고르기 전까지는 오픈소스 라이선스가 적용되지 않습니다.
