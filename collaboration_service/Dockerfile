FROM node:20-alpine

WORKDIR /app

# Install pnpm using npm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE ${HOCUSPOCUS_PORT}

CMD ["pnpm", "start"]