FROM node:18-alpine AS base

WORKDIR /app

COPY authService/package*.json ./
RUN npm ci || npm install --production

COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "run", "start"]
