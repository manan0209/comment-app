FROM node:18-alpine AS base
WORKDIR /app

FROM base AS backend-deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS backend-build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS backend-runtime
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=backend-build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=backend-build --chown=nestjs:nodejs /app/package.json ./package.json
USER nestjs
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/main"]
