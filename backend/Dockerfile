# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Create uploads dir (mounted as volume in production)
RUN mkdir -p uploads

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000
CMD ["node", "src/server.js"]
