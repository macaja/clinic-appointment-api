# ─── builder ────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools required by better-sqlite3 native module
RUN apt-get update -y && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── runner ─────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends curl sqlite3 && rm -rf /var/lib/apt/lists/*

ENV DATABASE_PATH=/data/clinic.db
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/scripts     ./scripts
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
