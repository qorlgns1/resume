# syntax=docker/dockerfile:1.7
# @resume/web 이미지. 저장소 루트를 빌드 컨텍스트로 사용한다:
#   docker build -f apps/web/Dockerfile -t resume-web .
# 비밀 정보는 이미지에 넣지 않고 실행 시 환경 변수로 전달한다.

ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

# 1) 이 앱과 의존 패키지만 남긴 작업 공간을 만든다.
FROM base AS prune
COPY . .
RUN pnpm dlx turbo@2.11.10 prune @resume/web --docker

# 2) 의존성 설치 후 standalone 출력으로 빌드한다.
FROM base AS build
COPY --from=prune /repo/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=prune /repo/out/full/ .
ENV NEXT_OUTPUT=standalone
RUN pnpm turbo run build --filter=@resume/web

# 3) 실행 이미지: standalone 서버와 정적 파일만 포함한다.
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
