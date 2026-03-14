FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY app/frontend/package.json app/frontend/package.json

RUN npm install --workspace app/frontend

COPY app/frontend app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace", "app/frontend", "--", "--host", "0.0.0.0", "--port", "5173"]
