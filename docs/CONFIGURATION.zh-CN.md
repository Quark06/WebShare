# 配置

在项目根目录的 `.env` 中填写，每行 `配置项=值`；可选项不用时留空或不填。修改后执行 `npm run pm2` 重启；`VITE_` 开头的配置须先执行 `npm run build`，再重启。

## 媒体（Media）

默认无需登录凭据（Cookie）。需要使用自己的账号时，从对应网站已登录浏览器的请求头（Request Header）中复制完整 `Cookie` 值，用单引号包住填写。

| 配置项 | 用途与填写方式 |
| --- | --- |
| `BILIBILI_COOKIE` | B 站（Bilibili）搜索和直播画质；填自己的 B 站 Cookie。 |
| `METING_NETEASE_COOKIE` | 网易云（NetEase）音乐；填网易云 Cookie。 |
| `METING_TENCENT_COOKIE` | QQ 音乐（QQ Music）；填 QQ 音乐 Cookie。 |
| `METING_KUGOU_COOKIE` | 酷狗（KuGou）音乐；填酷狗 Cookie。 |
| `METING_KUWO_COOKIE` | 酷我（Kuwo）音乐；填酷我 Cookie。 |
| `YOUTUBE_PROXY_URL` | YouTube 搜索代理（Proxy）；例如 `http://127.0.0.1:10808`，地址必须能从服务器访问。 |
| `YOUTUBE_API_KEY` | YouTube 歌单导入和视频信息；在 [Google Cloud](https://console.cloud.google.com/) 启用 YouTube Data API v3 后填密钥（API Key）。搜索不需要此项。 |

## 第三方解析（Third-party Resolver）

默认使用本地解析（`local`）。按需设置以下选项即可启用第三方服务，地址可替换为兼容服务；媒体 Cookie 仅用于本地解析。

| 配置项 | 用途 | 填写示例 |
| --- | --- | --- |
| `BILIBILI_RESOLVER` | B 站视频解析方式 | `bilibilix` 或 `local` |
| `BILIBILI_LIVE_RESOLVER` | B 站直播解析方式 | `bilibilix` 或 `local` |
| `BILIBILIX_URL` | Bilibilix 视频服务地址 | `https://www.bilibilix.com` |
| `BILIBILIX_LIVE_URL` | Bilibilix 直播服务地址 | `https://live.bilibilix.com` |
| `MUSIC_RESOLVER` | 音乐解析方式 | `meting-api` 或 `local` |
| `METING_API_URL` | Meting 服务地址 | `https://api.qijieya.cn/meting/` |
| `METING_API_PLATFORMS` | 使用第三方服务的音乐平台 | `netease,tencent`（网易云、QQ 音乐）；其他平台用本地解析。 |

## Discord 登录（Login Gate）

只允许指定 Discord 服务器的成员访问。在 [Discord 开发者门户（Developer Portal）](https://discord.com/developers/applications) 创建应用，在 **OAuth2 → Redirects** 添加 `https://你的域名/auth/discord/callback`；本地可用 `http://localhost:8080/auth/discord/callback`。

| 配置项 | 填写方式 |
| --- | --- |
| `DISCORD_AUTH_CLIENT_ID` | OAuth2 页的 Client ID。 |
| `DISCORD_AUTH_CLIENT_SECRET` | 同页的 Client Secret。 |
| `DISCORD_AUTH_GUILD_ID` | Discord 开启开发者模式（Developer Mode）后，右键服务器复制 ID；多个 ID 用逗号分隔，加入任意一个即可。 |
| `DISCORD_AUTH_REDIRECT_URI` | 可选；填写上面登记的完整回调地址（Callback URL），必须完全一致。默认使用当前站点地址加 `/auth/discord/callback`。 |
| `DISCORD_AUTH_SESSION_DAYS` | 可选；保持登录的天数，默认 `30`。 |

前三项全部填写才会启用。页面与接口（API）应使用同一地址；本地用构建后的 `8080` 页面验证登录。

## 房间保存（Persistence）

使用已创建的 PostgreSQL 数据库保存房间，重启后仍可恢复；不配置时，重启会丢失房间。

| 配置项 | 用途与填写示例 |
| --- | --- |
| `DATABASE_URL` | 数据库连接串（Connection String）：`postgresql://USER:PASSWORD@localhost:5432/webshare`。 |
| `ROOM_ARCHIVE_HOURS` | 空房间从列表中隐藏前的小时数，默认 `72`；有数据库时仍可通过原链接恢复。 |

首次使用新数据库时，将用户名和密码替换为自己的值后初始化：

```bash
psql 'postgresql://USER:PASSWORD@localhost:5432/webshare' -f sql/schema.sql
```

## 其他可选服务（Optional Services）

| 配置项 | 用途与填写方式 |
| --- | --- |
| `VITE_FIREBASE_CONFIG` | Firebase 账号登录；填 Firebase 项目设置中的 Web 应用配置，使用单引号包住一行 JSON。 |
| `FIREBASE_ADMIN_SDK_CONFIG` | Firebase 服务端验证；填同项目服务账号（Service Account）的私钥 JSON，使用单引号包住一行 JSON。 |
| `VITE_OAUTH_REDIRECT_HOSTNAME` | Firebase / Discord 账号关联的站点地址，例如 `https://watch.example.com`；默认当前站点。 |
| `VITE_DISCORD_CLIENT_ID` | Firebase 用户的 Discord 账号关联；填 Discord 应用 Client ID，与上面的登录拦截独立。 |
| `DISCORD_BOT_TOKEN`、`DISCORD_SITE_URL` | Discord 建房机器人（Bot）的令牌（Token）和站点地址；填完后运行 `node server/discordBot.ts`。 |
| `DISCORD_API_URL` | 机器人的接口地址；默认与 `DISCORD_SITE_URL` 相同。 |
| `VITE_ICE_SERVERS` | 共享与视频聊天的中继（TURN Relay）；填服务商提供的 ICE 服务器 JSON，例如 `'[{"urls":"turn:turn.example.com:3478","username":"USER","credential":"PASSWORD"}]'`。 |
| `STRIPE_SECRET_KEY`、`STRIPE_PRICE_ID` | Stripe 订阅（Subscription）；填自己的 Secret Key 和 Price ID，需启用 Firebase 登录。 |
| `DOCKER_VM_HOST`、`DOCKER_VM_HOST_SSH_USER` | 虚拟浏览器（Virtual Browser）的 Docker 主机地址和 SSH 用户；主机需安装 Docker、配置 Neko 的 HTTPS，并允许服务端通过 `~/.ssh/id_rsa` 登录。 |
