# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5172

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# drizzle-kit push needs the schema/config sources (it transpiles them itself),
# not the compiled server output.
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/db ./src/db
COPY --from=build /app/src/config ./src/config

EXPOSE 5172

# Push the Drizzle schema (creates tables on first boot, no-op after) before
# starting the SvelteKit/adapter-node server.
CMD ["sh", "-c", "npx drizzle-kit push --force && node build"]
