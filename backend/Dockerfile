# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: runtime (Node + TeX Live so real pdflatex is available) ────────
FROM node:20-bookworm-slim
WORKDIR /app

# TeX Live packages needed by the resume templates:
#   texlive-latex-extra  -> titlesec, enumitem, fullpage, ...
#   texlive-fonts-extra  -> fontawesome, fontawesome5
#   texlive-fonts-recommended -> marvosym
RUN apt-get update && apt-get install -y --no-install-recommends \
      texlive-latex-base \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-fonts-recommended \
      texlive-fonts-extra \
      lmodern \
    && rm -rf /var/lib/apt/lists/*

# Create uploads dir (mounted as volume in production)
RUN mkdir -p uploads

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000
CMD ["node", "src/server.js"]
