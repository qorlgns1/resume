# syntax=docker/dockerfile:1.7
# @resume/admin 이미지. 저장소 루트를 빌드 컨텍스트로 사용한다:
#   docker build -f apps/admin/Dockerfile -t resume-admin .
# 비밀 정보는 이미지에 넣지 않고 실행 시 환경 변수로 전달한다 (AUTH_SECRET, ADMIN_URL 필수).

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
RUN pnpm dlx turbo@2.11.10 prune @resume/admin --docker

# 2) 의존성 설치 후 standalone 출력으로 빌드한다.
FROM base AS build
COPY --from=prune /repo/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=prune /repo/out/full/ .
ENV NEXT_OUTPUT=standalone
RUN pnpm turbo run build --filter=@resume/admin

# 3) 실행 이미지: standalone 서버, 정적 파일, 마이그레이션, 계정 CLI만 포함한다.
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3001 \
    DATABASE_PATH=/data/resume.db \
    MIGRATIONS_DIR=/app/apps/admin/drizzle
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
    && mkdir -p /data && chown nextjs:nodejs /data
WORKDIR /app
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/public ./apps/admin/public
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/drizzle ./apps/admin/drizzle
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/dist/cli.mjs ./apps/admin/cli.mjs
# 계정 CLI는 Next 밖에서 실행되므로 standalone에 포함된 better-sqlite3를 일반 경로로 연결한다.
RUN mkdir -p /app/apps/admin/node_modules \
    && ln -s /app/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 /app/apps/admin/node_modules/better-sqlite3 \
    && test -f /app/apps/admin/node_modules/better-sqlite3/package.json
# SQLite DB와 업로드 파일. 컨테이너를 다시 만들어도 남도록 볼륨으로 연결한다.
VOLUME ["/data"]
WORKDIR /app/apps/admin
USER nextjs
EXPOSE 3001
# 계정 만들기: docker compose exec -it admin node cli.mjs create
CMD ["node", "server.js"]
