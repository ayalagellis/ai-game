# docker/server.Dockerfile
############################
# 1️⃣ BUILD STAGE
############################
FROM node:25-slim AS builder

WORKDIR /app
RUN npm install -g npm@11

COPY package*.json tsconfig.base.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

RUN npm install

COPY . .

RUN npm run build -w shared
RUN npm run build -w server

############################
# 2️⃣ RUNTIME
############################
FROM node:25-slim AS runtime

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
