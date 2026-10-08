FROM node:22-slim

# bun installs dependencies and runs scripts; node runs the Next.js server.
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Placeholder secret only so Better Auth doesn't complain while Next collects
# page data. The real values come from the environment at runtime.
RUN BETTER_AUTH_SECRET=build-time-placeholder bun run build

ENV NODE_ENV=production
EXPOSE 10000

# Render sets PORT. Migrate first so a fresh database gets its tables.
CMD ["sh", "-c", "bun src/db/migrate.ts && bun run start"]
