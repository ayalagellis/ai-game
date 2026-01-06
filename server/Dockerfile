# 1. Build stage
FROM node:18 AS builder

WORKDIR /app

# Copy package files for dependency install
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --prefix server

# Copy source code
COPY server/ ./server
COPY shared/ ./shared

# Build TypeScript -> JavaScript
RUN npm run build --prefix server

# 2. Production stage
FROM node:18-slim AS runtime

WORKDIR /app

# Copy built files and node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/shared ./shared

EXPOSE 3000

CMD ["node", "dist/index.js"]
