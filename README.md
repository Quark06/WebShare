# WebShare

[English](README.md) | [简体中文](README.zh-CN.md)

A self-hosted website for watching videos, listening to music and chatting together.

## Features

- Synchronized Bilibili, YouTube and music playback.
- Screen and local file sharing, text and video chat.
- Room directory, passwords and optional persistence.
- English and Chinese interfaces, optional Discord login and third-party resolvers.

## Deployment

Requires **Node.js 24+**, npm and Git.

```bash
git clone https://github.com/Quark06/WebShare.git
cd WebShare
cp .env.example .env
# Edit .env as needed.
npm ci --include=dev
npm run build
npm run pm2
```

Open [http://localhost:8080](http://localhost:8080). See [configuration](docs/CONFIGURATION.md) and the [Linux / Docker deployment guide](docs/DEPLOYMENT.md).

Based on [WatchParty](https://github.com/howardchung/watchparty) · [MIT License](LICENSE)
