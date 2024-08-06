FROM oven/bun:1

RUN mkdir /app

WORKDIR /app

COPY ./ ./

RUN bun install

ENTRYPOINT [ "bun", "run", "index.ts" ]