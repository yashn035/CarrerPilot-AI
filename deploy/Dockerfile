FROM node:18-alpine

WORKDIR /app

# Install dependencies before copying source code to take advantage of Docker cache layering
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server/src/server.js"]
