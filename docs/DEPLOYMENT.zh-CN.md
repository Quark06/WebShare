# WebShare 服务器部署指南

[简体中文 README](../README.zh-CN.md) | [English README](../README.md)

本指南面向 Linux 服务器，默认部署一个 WebShare 进程（Process），由 Nginx 提供反向代理（Reverse Proxy）和 HTTPS。也提供 Docker 容器（Container）部署方式。两种方式任选其一。

## 1. 部署范围与运行要求

- 原生运行使用 Node.js 24 或更新版本、npm 和 Git。Node.js 安装方法见[官方说明](https://nodejs.org/en/download)。Docker 镜像（Image）使用 `node:24-alpine`。
- 生产构建（Production Build）包含 React 前端、Vite 构建和前后端 TypeScript 类型检查（Type Checking）。服务器直接运行 `server/server.ts`，不需要单独启动前端开发服务器。
- 默认端口（Port）为 8080。一个域名同时提供页面、接口（API）和 Socket.IO 实时连接（WebSocket）。
- 基础共同观看功能可以不配置 Redis、PostgreSQL、Firebase 或虚拟浏览器（Virtual Browser）。不配置数据库时，房间保存在内存（In-Memory State）中，进程重启后临时房间会丢失。
- B 站视频、直播和音乐的音视频由观看者直接连接平台内容分发网络（Content Delivery Network，CDN）。服务器承担页面、解析、搜索、聊天和房间同步（Synchronization）流量。屏幕共享及虚拟浏览器等功能有各自的网络和服务要求。
- 服务器需要能够访问 GitHub、npm 软件包仓库（Registry）以及所使用媒体平台的接口。服务器可解析地址和观看者可播放媒体需要分别验证。

以下原生部署命令以运行应用的普通用户执行，示例目录为 `~/WebShare`。安装 Nginx 和配置系统服务时才使用 `sudo`。后续 PM2 操作使用同一用户，因为各用户的 PM2 进程列表独立。

## 2. 原生部署：Node.js + PM2

### 2.1 获取代码和安装依赖

先确认 `node --version` 为 v24 或更新版本，再执行：

```bash
git clone --branch master https://github.com/Quark06/WebShare.git
cd WebShare
cp .env.example .env
npm ci --include=dev
```

`--include=dev` 用于安装构建所需的开发依赖（Development Dependencies）。现有后端也会导入 `twitch-m3u8` 等列在开发依赖中的包，因此当前部署需要保留完整依赖。

### 2.2 配置服务器

编辑项目根目录的 `.env`。以下是通过同一服务器上的 Nginx 提供服务的基本配置：

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=8080
BUILD_DIRECTORY=build
SHARD=
SSL_KEY_FILE=
SSL_CRT_FILE=
VITE_SERVER_HOST=
VITE_FIREBASE_CONFIG=
```

| 配置项 | 用途 |
| --- | --- |
| `HOST=127.0.0.1` | 原生进程只监听本机，由 Nginx 接收公网请求。 |
| `PORT=8080` | WebShare 后端监听端口，需与 Nginx 的上游地址（Upstream）一致。 |
| `SHARD=` | 单进程部署保持为空，不启用分片（Sharding）。 |
| `SSL_KEY_FILE`、`SSL_CRT_FILE` | 本指南由 Nginx 处理 HTTPS，这两项保持为空。 |
| `VITE_SERVER_HOST=` | 留空后，生产前端使用当前网页的来源地址（Origin），适合同域名部署。 |
| `VITE_FIREBASE_CONFIG=` | 留空可关闭需要登录的功能；如需身份验证（Authentication），填写自己的 Firebase 配置。 |
| `BILIBILI_COOKIE` | 可选的登录凭据（Cookie），用于 B 站搜索和直播画质请求，仅供服务器使用。 |
| `METING_*_COOKIE` | 可选的音乐平台登录 Cookie。 |
| `YOUTUBE_PROXY_URL` | 可选的 YouTube 搜索代理（Proxy），例如服务器上可访问的 HTTP 代理地址。 |
| `DATABASE_URL`、`REDIS_URL` | 可选的数据库和 Redis 连接地址；启用前先部署相应服务。 |

`VITE_*` 是前端构建时配置（Build-time Configuration），修改后需要重新构建。服务端配置在进程启动时读取，修改后需要重启。`VITE_*` 会进入前端代码，只填写公开的客户端配置，不放入登录 Cookie 或服务端私钥。参见 [Vite 环境变量说明](https://vite.dev/guide/env-and-mode.html)。

同域名部署时不要把 `VITE_SERVER_HOST` 填成 `http://127.0.0.1:8080`，否则其他观看者的浏览器会连接自己的本机。前后端分开部署时，填写观看者能够访问的后端 HTTPS 地址，并确认 WebSocket 可连接。

YouTube 搜索代理运行在服务器所在的网络环境中；服务器的 `127.0.0.1` 指服务器自身。Windows 本机系统代理不会自动成为 Linux 服务器的代理。

如启用 Firebase，需配置自己的 `VITE_FIREBASE_CONFIG`、服务端 `FIREBASE_ADMIN_SDK_CONFIG` 及授权域名（Authorized Domains）。使用涉及跳转的登录或账号关联功能时，也应将 `VITE_OAUTH_REDIRECT_HOSTNAME` 设置为自己的站点来源地址。

可选的第三方解析（Third-party Resolvers）配置如下；不设置时仍使用原有链路（Local Pipeline）。修改后重启服务即可：

```dotenv
BILIBILI_RESOLVER=bilibilix
BILIBILI_LIVE_RESOLVER=bilibilix
BILIBILIX_URL=https://www.bilibilix.com
BILIBILIX_LIVE_URL=https://live.bilibilix.com
MUSIC_RESOLVER=meting-api
METING_API_URL=https://api.qijieya.cn/meting/
METING_API_PLATFORMS=netease,tencent
```

视频、直播、音乐可分别将对应选择器（Resolver Selector）改为 `local`，恢复原链路。第三方 Meting 默认只用于网易云（NetEase）和 QQ 音乐（QQ Music）；酷狗（KuGou）和酷我（Kuwo）继续使用本地 Meting。兼容服务更换时修改上述地址和支持的平台列表（Platform List），无需改动播放器。B 站搜索仍由原接口提供。平台登录凭据（Cookie）不会发送给第三方，第三方失败时不自动追加原平台请求。详见 [第三方解析配置](../README.zh-CN.md#可选第三方解析third-party-resolvers)。

如需只允许指定 Discord 服务器的成员使用，可启用 Discord 登录拦截（Login Gate）。在 Discord 开发者门户中，将 `https://<你的域名>/auth/discord/callback` 添加到应用 OAuth2 设置的 Redirects，然后在 `.env` 中填写：

```dotenv
DISCORD_AUTH_CLIENT_ID=
DISCORD_AUTH_CLIENT_SECRET=
DISCORD_AUTH_GUILD_ID=123456789012345678
```

三项都填写后才会启用，修改后重启服务即可。下文的 Nginx 配置已转发 `X-Forwarded-Proto`，回调地址会使用 HTTPS，登录 Cookie 也会带上 `Secure`。拦截要求页面与接口部署在同一域名下。详见 [Discord 登录拦截](../README.zh-CN.md#discord-登录拦截login-gate)。

### 2.3 构建和启动

```bash
npm run build
npm run pm2
curl -fsS http://127.0.0.1:8080/ping
```

最后一条命令应返回 `"pong"`。PM2 已列在项目依赖中，无需另行全局安装。`npm run pm2` 使用根目录的 `ecosystem.config.cjs`，只启动或重启名为 `webshare` 的一个生产进程，采用单实例派生模式（Fork Mode）。配置中的工作目录（Working Directory）固定为项目根目录，保证 `.env` 和 `build` 的读取路径一致。

查看运行状态和日志（Logs）：

```bash
npm exec -- pm2 status
npm exec -- pm2 logs webshare --lines 50
```

日志命令持续跟踪输出，可按 `Ctrl+C` 退出查看，应用会继续运行。

### 2.4 开机自启

```bash
npm exec -- pm2 startup
```

按 PM2 输出执行对应的 `sudo ...` 命令，再保存进程列表：

```bash
npm exec -- pm2 save
```

升级 Node.js 或迁移安装路径后，需要重新生成开机启动配置（Startup Configuration）。操作方式参见 [PM2 官方说明](https://pm2.keymetrics.io/docs/usage/startup/)。

## 3. Nginx、域名和 HTTPS

先把域名的 DNS 记录（DNS Record）指向服务器公网地址，并放行 80、443 端口。在 Ubuntu/Debian 上可安装 Nginx：

```bash
sudo apt update
sudo apt install -y nginx
```

创建 `/etc/nginx/sites-available/webshare`，将 `watch.example.com` 替换为自己的域名：

```nginx
map $http_upgrade $webshare_connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name watch.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $webshare_connection_upgrade;
        proxy_read_timeout 300s;
    }
}
```

该示例适用于 Ubuntu/Debian 默认的 Nginx 目录布局，`sites-enabled` 在 `http` 配置块内被加载，因而可使用这里的 `map`。启用配置前，确保同名链接尚未存在：

```bash
sudo ln -s /etc/nginx/sites-available/webshare /etc/nginx/sites-enabled/webshare
sudo nginx -t && sudo systemctl reload nginx
```

Socket.IO 连接使用 WebSocket，反向代理需要转发 `Upgrade` 和 `Connection` 请求头（Request Headers）。上面的 `location /` 同时代理页面、接口和 `/socket.io/`，单页应用（Single-Page Application，SPA）的房间路由由 WebShare 后端处理。相关配置依据见 [Nginx WebSocket 官方说明](https://nginx.org/en/docs/http/websocket.html)。

按 [Certbot 官方安装说明](https://certbot.eff.org/instructions) 安装适合当前系统的 Certbot，随后申请 HTTPS 证书（Certificate）：

```bash
sudo certbot --nginx -d watch.example.com
sudo certbot renew --dry-run
```

按 Certbot 提示启用 HTTP 到 HTTPS 的跳转（Redirect）。摄像头等 WebRTC 功能需要 HTTPS；最终验收也应使用实际 HTTPS 地址。

## 4. Docker 部署（可选）

先在服务器安装 Docker Engine，方法见 [Docker 官方安装说明](https://docs.docker.com/engine/install/)。获取代码并创建 `.env` 的步骤与原生部署相同，然后在项目根目录执行：

```bash
docker build -t webshare:local .
docker run -d \
  --name webshare \
  --restart unless-stopped \
  --env-file .env \
  -e NODE_ENV=production \
  -e HOST=0.0.0.0 \
  -e PORT=8080 \
  -p 127.0.0.1:8080:8080 \
  webshare:local
curl -fsS http://127.0.0.1:8080/ping
```

容器内部必须监听 `0.0.0.0` 才能接收端口映射（Port Mapping）的请求。示例通过 `-e HOST=0.0.0.0` 覆盖原生部署 `.env` 中的回环地址（Loopback Address），而宿主机（Host）只把 8080 暴露在 `127.0.0.1`，继续复用前面的 Nginx 配置。保持 `SHARD`、`SSL_KEY_FILE` 和 `SSL_CRT_FILE` 为空。

Dockerfile 会安装完整依赖并构建前端，运行时通过 `NODE_ENV=production` 直接启动 Node.js。`.dockerignore` 排除本机依赖、构建产物（Build Artifacts）、Git 历史和 `.env` 等文件，运行配置通过 `--env-file` 提供。Docker 构建上下文的规则见[官方说明](https://docs.docker.com/build/concepts/context/#dockerignore-files)。

镜像默认以匿名使用方式构建，`VITE_FIREBASE_CONFIG` 和 `VITE_SERVER_HOST` 为空。如需自己的 Firebase 登录配置或独立后端地址，应在构建时传入公开参数（Build Arguments），例如：

```bash
docker build -t webshare:local \
  --build-arg VITE_FIREBASE_CONFIG='{"apiKey":"YOUR_PUBLIC_KEY","authDomain":"YOUR_PROJECT.firebaseapp.com","projectId":"YOUR_PROJECT"}' \
  --build-arg VITE_SERVER_HOST= \
  --build-arg VITE_OAUTH_REDIRECT_HOSTNAME=https://watch.example.com \
  .
```

Firebase 参数应替换为自己的完整客户端配置。修改运行时 `--env-file` 中的 `VITE_*` 不会修改已经构建进镜像的前端。

查看运行状态和日志：

```bash
docker ps --filter name=webshare
docker logs --tail 50 webshare
```

更新 Docker 部署时，先确保位于干净的 `master` 分支，再执行：

```bash
git pull --ff-only origin master
docker build -t webshare:local .
docker stop webshare
docker rm webshare
```

构建成功后再停止旧容器，随后重新执行本节的 `docker run` 命令及健康检查（Health Check）。如果首次构建传入了 `VITE_*` 参数，更新构建时也要传入相同的参数。临时房间会在容器重建时丢失。

## 5. 更新原生部署

在项目根目录执行：

```bash
npm run deploy
curl -fsS http://127.0.0.1:8080/ping
npm exec -- pm2 status
```

`npm run deploy` 按以下顺序执行：

1. 检查 Node.js 版本、当前 `master` 分支及工作区（Working Tree）是否干净。
2. 通过 `git pull --ff-only origin master` 更新代码，只接受快进合并（Fast-forward Merge）。
3. 执行 `npm ci --include=dev` 安装锁文件（Lockfile）确定的依赖。
4. 执行 `npm run build` 完成构建和类型检查。
5. 只启动或重启 PM2 中的 `webshare` 应用。

这套流程采用原地更新（In-place Update），请安排维护时间。依赖安装和构建会修改当前项目目录，重启会断开现有连接；未持久化的临时房间会丢失。安装或构建失败时，脚本退出且不执行 PM2 重启，应检查错误和依赖状态后再继续。脚本保留本地修改并拒绝脏工作区，不执行强制重置、清空日志或删除其他 PM2 应用。

如果仅修改服务端 `.env`，使用 `npm run pm2` 重启即可。如果修改 `VITE_*`，先执行 `npm run build`，再执行 `npm run pm2`。`.env` 已被 Git 忽略，不影响干净工作区检查。

## 6. 运行配置说明

| 项目 | 当前行为 |
| --- | --- |
| 更新脚本 | `npm run deploy` 要求 Node.js 24、干净的 `master` 分支；拉取代码、安装和构建成功后只启动或重启 `webshare`。 |
| PM2 入口 | 根目录 `ecosystem.config.cjs` 默认运行一个生产进程。可选分片（Sharding）通过 `SHARD` 和 `SHARD_COUNT` 配置。 |
| Docker | 使用 Node.js 24、完整依赖和生产环境；`.dockerignore` 排除本地依赖、构建产物及 `.env`。 |
| 前端配置 | `VITE_*` 在构建时读取。Docker 通过构建参数（Build Arguments）传入；修改后重建。 |
| GitHub Actions | 持续集成（Continuous Integration，CI）只检查构建，不自动部署服务器。 |
| 本机预览 | `scripts/preview.mjs` 用于 Windows 本地预览；Linux 常驻运行使用 PM2 或 Docker。 |

若要启用虚拟浏览器、分片或后台任务，请使用自己的基础设施配置；基础共同观看部署使用上面的单进程入口。Discord 账号关联需要构建时设置 `VITE_DISCORD_CLIENT_ID`，Docker 部署可使用同名 `--build-arg`。订阅（Subscription）需要自己的 `STRIPE_SECRET_KEY` 和 `STRIPE_PRICE_ID`，默认关闭。

若启用 PostgreSQL，通过 `DATABASE_URL` 连接自己的数据库，并使用 [sql/schema.sql](../sql/schema.sql) 初始化新数据库结构（Database Schema）。

屏幕与文件共享、视频聊天默认只使用公共 STUN 服务。跨网络需要中继（TURN Relay）时，配置自己的 `VITE_ICE_SERVERS` JSON 数组并重建前端；Docker 可传入同名 `--build-arg`。中继会承担对应的共享媒体流量，B 站和音乐的直接播放不受此项影响。

## 7. 部署后的功能验收

由团队测试人员在实际服务器和观看者网络中进行功能测试（Functional Testing）：

1. 域名首页、`/ping` 及房间地址 `/watch/<roomId>` 均可访问，刷新房间页面仍能进入。
2. 两位观看者加入同一房间，确认 WebSocket 连接成功，聊天和播放、暂停操作同步。
3. 播放普通 B 站视频、B 站直播和音乐，确认真实音视频解码（Audio/Video Decoding），而非仅成功返回播放地址。
4. B 站直播显示 LIVE，未开播直播间显示明确提示；普通视频可跳转进度（Seek）。
5. 查看浏览器网络请求（Network Requests），确认 B 站及音乐媒体来自平台 CDN，并检查服务器日志是否有解析错误。
6. 如启用 Discord 登录拦截：未登录的浏览器访问房间地址时显示登录页；服务器成员授权后回到原房间，非成员看到拦截提示；`/ping` 仍可直接访问。

部署脚本和本机运行验证不等于公网部署验收。Linux 上的 Nginx、HTTPS 证书、Docker 镜像实际构建，以及不同网络观看者的可用性，应以目标服务器上的测试结果为准。

本次已在 Windows 的 Node.js 24 环境中通过完整构建，并用隔离的 PM2 进程环境验证生产模式、单进程启动、首页、`/ping`、创建房间及 WebSocket 连接。也验证了仅重启 `webshare` 时其他测试进程保持运行，以及一次性部署夹具（Fixture）中的更新顺序和构建失败时停止重启的行为。Docker、Nginx 和 Linux 服务器部署尚未实际执行。
