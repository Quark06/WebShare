# WebShare

[English](README.md) | [简体中文](README.zh-CN.md)

可自行部署（Self-hosted）的同步观影、听歌与聊天网站。

## 功能（Features）

- 同步播放（Synchronized Playback）B 站（Bilibili）、YouTube 和国内音乐。
- 本地文件共享（File Sharing）、文字与视频聊天。
- 房间列表、密码保护与可选持久化（Persistence）。
- 中英双语，可选 Discord 登录与第三方解析（Third-party Resolver）。

## 部署（Deployment）

需要 **Node.js 24+**、npm 和 Git。

```bash
git clone https://github.com/Quark06/WebShare.git
cd WebShare
cp .env.example .env
# 按需编辑 .env
npm ci --include=dev
npm run build
npm run pm2
```

打开 [http://localhost:8080](http://localhost:8080)。可选功能见[配置说明（Configuration）](docs/CONFIGURATION.zh-CN.md)，Linux / Docker 部署见[部署指南（Deployment Guide）](docs/DEPLOYMENT.zh-CN.md)。

基于 [WatchParty](https://github.com/howardchung/watchparty) · [MIT 许可证（License）](LICENSE)
