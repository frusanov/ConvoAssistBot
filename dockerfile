FROM oven/bun:1

WORKDIR /app

COPY ./ ./

RUN bun install --frozen-lockfile --production

ENV NODE_ENV=production

ENTRYPOINT [ "bun", "run", "index.ts" ]