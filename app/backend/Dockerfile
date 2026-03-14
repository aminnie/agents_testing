FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY app/backend/package.json app/backend/package.json

RUN npm install --workspace app/backend

COPY app/backend app/backend

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "app/backend"]
