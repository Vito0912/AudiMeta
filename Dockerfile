FROM node:22-alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

USER node
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache
RUN npm install

COPY --chown=node:node . .

RUN chown -R node /app/node_modules

RUN npx prisma db push
RUN npx prisma generate

EXPOSE 4005

CMD [ "npx", "tsx", "app.ts" ]