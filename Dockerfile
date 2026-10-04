FROM node:24-alpine

WORKDIR /usr/src

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

# Vite reads these public settings at build time; server secrets are runtime env.
ARG VITE_FIREBASE_CONFIG=""
ARG VITE_SERVER_HOST=""
ARG VITE_OAUTH_REDIRECT_HOSTNAME=""
ARG VITE_DISCORD_CLIENT_ID=""
ARG VITE_ICE_SERVERS=""
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server/server.ts"]
