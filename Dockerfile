FROM node:22-alpine AS base

RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.yarn ./.yarn
COPY --from=base /app/entrypoint.sh ./

EXPOSE 3032

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["yarn", "start"]
