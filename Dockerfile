
# =========================
# Dockerfile (DEV for NestJS)
# =========================
FROM node:24-slim

WORKDIR /app

RUN apt-get update -y \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
     tzdata openssl procps \
  && ln -snf /usr/share/zoneinfo/Asia/Bangkok /etc/localtime \
  && echo "Asia/Bangkok" > /etc/timezone \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Bangkok

COPY package*.json ./
RUN npm install

COPY . .

# Prisma client for dev
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

EXPOSE 3000

# Hot reload
CMD ["npm", "run", "start:dev"]

