# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

# SvelteKit inlines PUBLIC_* env vars into the client bundle at build time,
# so this has to be a build arg, not a runtime env var.
ARG PUBLIC_BACKEND_URL=http://localhost:5172
ENV PUBLIC_BACKEND_URL=${PUBLIC_BACKEND_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5173

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/build ./build

EXPOSE 5173

CMD ["node", "build"]
