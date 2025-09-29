# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# =============================
# 2. Production stage
# =============================
FROM node:20-alpine AS runner

WORKDIR /app

# Устанавливаем skopeo для работы с контейнерами
RUN apk add --no-cache skopeo bash curl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
