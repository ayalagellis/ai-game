# docker/client.Dockerfile
############################
# 1️⃣ BUILD STAGE
############################
FROM node:25-slim AS builder

WORKDIR /app
RUN npm install -g npm@11

# copy workspace root files
COPY package*.json tsconfig.base.json ./

# copy workspace package.jsons
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# install deps (workspace-aware)
RUN npm install

# copy all source code
COPY . .

# build shared + client
RUN npm run build -w shared
RUN npm run build -w client

############################
# 2️⃣ NGINX RUNTIME
############################
FROM nginx:stable-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
