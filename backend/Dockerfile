FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Create database and uploads directories
RUN mkdir -p data uploads

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
