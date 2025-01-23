FROM node:20-alpine as builder

WORKDIR /app

COPY ./frontend/package.json /app/
COPY ./frontend/pnpm-lock.yaml /app/

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the frontend
COPY ./frontend /app

# Build for production
RUN pnpm build

# Using a production base for serving static site
FROM node:20-alpine as runner
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "start"]
