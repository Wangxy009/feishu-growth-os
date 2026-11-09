FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY config/bitable-schema.json ./config/bitable-schema.json

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4280
EXPOSE 4280

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:4280/api/health >/dev/null || exit 1

CMD ["node", "src/server.js"]
