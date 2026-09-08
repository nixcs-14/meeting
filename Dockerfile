# =========================
# BUILD
# =========================
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL nécessaire à Prisma
RUN apt-get update \
    && apt-get install -y openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copier package.json + package-lock.json
COPY package*.json ./

# Copier Prisma AVANT npm ci
# car package.json possède un postinstall: prisma generate
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Copier le reste du projet
COPY . .

# Regénérer explicitement Prisma
RUN npx prisma generate

# Build Next.js
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
    && apt-get install -y openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma
COPY --from=builder /app/prisma ./prisma

# SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]