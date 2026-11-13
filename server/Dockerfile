# ============================================
# PharmaCare Backend (Express + TypeScript)
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---------- Production stage ----------
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy seed data (tsx is needed only for seeding, not at runtime)
COPY src/seed/ ./src/seed/
COPY tsconfig.json ./

EXPOSE 5001

CMD ["node", "dist/index.js"]
