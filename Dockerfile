FROM oven/bun:latest

RUN mkdir /app

WORKDIR /app

COPY ./ ./

RUN bun install

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT [ "/app/entrypoint.sh" ]
