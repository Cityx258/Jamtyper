FROM node:22-slim

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN BETTER_AUTH_SECRET=build-time-placeholder bun run build

ENV NODE_ENV=production
EXPOSE 10000

CMD ["sh", "-c", "bun src/db/migrate.ts && bun src/db/seed.ts && bun run start"]
