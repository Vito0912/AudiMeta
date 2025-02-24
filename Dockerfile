FROM node:22-alpine

# Create app directory
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./

USER node
RUN npm install

COPY --chown=node:node . .

RUN npx prisma db push
RUN npx prisma generate

EXPOSE 4005

CMD [ "npx", "tsx", "app.ts" ]