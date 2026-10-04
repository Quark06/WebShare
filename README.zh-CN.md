# WebShare

[English](README.md) | [简体中文](README.zh-CN.md)

WebShare 是可自行部署的同步观影、B 站直播、音乐与聊天网站。

## 功能介绍

- 同步当前房间内正在观看的视频。
- 所有观看者的播放、暂停和跳转进度（Seek）操作保持同步（Synchronization）。
- 支持以下媒体来源和共享方式：
  - 屏幕共享（Screen Sharing）：整个屏幕、浏览器标签页或应用窗口。
  - 通过单独配置的服务启动共享虚拟浏览器（Virtual Browser）。
  - 共享并播放自己的本地文件（Stream Your Own File）。
  - 互联网上可通过 HTTP 访问的视频文件。
  - YouTube 视频。
  - B 站（Bilibili）视频搜索与链接，通过 HTML5 单文件 MP4 直接播放。
  - B 站直播间链接，通过 `@bililive-tools/stream-get` 获取 HLS/AVC 直播流并直接播放。
  - 网易云音乐（NetEase）、QQ 音乐（QQ Music）、酷狗音乐（KuGou）和酷我音乐（Kuwo）的歌曲与歌单链接，通过 Meting 接入。
  - 磁力链接（Magnet Link），通过 WebTorrent 播放。
  - `.m3u8` 流媒体，使用 HTTP 实时流传输（HTTP Live Streaming，HLS）。
- 按需创建独立房间。
- 文字聊天（Text Chat）。
- 视频聊天（Video Chat）。

## 快速开始

- 使用 Node.js 24 或更新版本。
- 执行 `git clone git@github.com:Quark06/WebShare.git` 克隆仓库（Repository），然后进入 `WebShare` 目录。
- 将 `.env.example` 复制为 `.env`，根据下方的进阶配置说明，填写所需功能的配置项。
- 执行 `npm ci --include=dev` 安装项目依赖（Dependencies）。
- 执行 `npm run dev` 启动服务器。
  - 默认端口（Port）为 8080，可通过环境变量（Environment Variable）`PORT` 修改。
  - 如需 HTTPS，设置 `SSL_KEY_FILE` 和 `SSL_CRT_FILE`。
- 在另一个终端（Shell）中执行 `npm run ui`，使用独立端口启动 React 前端应用。
  - 如果修改了服务器地址或端口，通过 `VITE_SERVER_HOST` 指定服务器地址。
  - 如需 HTTPS，设置 `SSL_KEY_FILE` 和 `SSL_CRT_FILE`。
  - 浏览器的部分 WebRTC 功能（例如摄像头）要求使用 HTTPS。

生产构建（Production Build）使用 `npm run build`。随后设置 `NODE_ENV=production` 并执行 `npm start` 启动服务器。同一服务器会提供构建后的前端页面和接口（API），默认使用 8080 端口。

## 服务器部署

请参阅[服务器部署指南](docs/DEPLOYMENT.zh-CN.md)，包含 Linux 单进程 PM2 部署、Nginx/HTTPS、Docker、更新流程、运行配置说明和功能验收（Functional Testing）。

常驻运行使用 `npm run pm2`；已部署服务器的更新使用 `npm run deploy`。该更新流程要求位于干净的 `master` 分支，完成依赖安装、构建（Build）和类型检查（Type Checking）后，只重启 `webshare` 应用。

## 进阶配置（可选）

以下配置均为可选项。不配置时应用也应能够运行，但部分功能可能不可用。

### YouTube 视频搜索

视频搜索在服务器端使用 [YouTube.js](https://github.com/LuanRT/YouTube.js)（`youtubei.js`），不需要 Google API 密钥（API Key）或登录 YouTube。

在房间的搜索平台选择器中选择 **YouTube**，输入关键词后按回车或点击 **Search**。选择结果即可播放，也可点击 **Add to Playlist** 加入播放队列（Playlist）。视频搜索仅在提交时执行；无论选择哪个搜索平台，仍可直接粘贴媒体链接。搜索最多返回首页的 25 个普通视频，包含标题、封面、作者和时长。相同搜索共享 5 分钟的缓存（Cache）；搜索失败缓存 30 秒，并在搜索框中显示错误。将最近搜索过的视频加入队列时，会复用搜索结果中的元数据（Metadata），不需要 API 密钥。

服务器必须能够访问 YouTube。YouTube.js 使用 YouTube 内部接口（Internal API），接口可能发生变更或拒绝请求。搜索成功不代表视频一定允许嵌入播放（Embedded Playback）。每位观看者仍通过现有的 YouTube 嵌入式框架（iframe）使用自己的网络播放视频。

配置代理（Proxy）后，YouTube 搜索请求会使用 HTTP(S) 代理。选择优先级依次为：服务器环境中的 `YOUTUBE_PROXY_URL`、`HTTPS_PROXY` / `HTTP_PROXY`（也支持小写形式及 `NO_PROXY`），最后是已启用的 Windows 手动系统代理。例如，在服务器 `.env` 中设置 `YOUTUBE_PROXY_URL=http://127.0.0.1:10808`，然后重启服务器。Windows 下会自动检测已启用的系统代理，因此搜索不要求开启 TUN 模式（TUN Mode）。每个服务器进程（Process）仅在启动时读取一次代理选择，修改代理设置后需重启。没有配置代理时，请求直接连接。

### 可选的 YouTube Data API

`YOUTUBE_API_KEY` 仍是可选项，用于添加尚未搜索过的 YouTube 链接时获取元数据，以及导入 YouTube 播放列表。在 [Google Cloud](https://console.cloud.google.com/) 中启用 **YouTube Data API v3** 并创建 API 密钥，将其填入服务器 `.env` 的 `YOUTUBE_API_KEY`，然后重启服务器。即使配置了此密钥，关键词搜索也始终使用 YouTube.js。

### B 站视频

在现有房间输入框中粘贴普通 B 站视频链接，例如 `bilibili.com/video/BV...`、`av...` 或 `b23.tv` 短链接（Short Link）。通过显式添加 `?p=2` 选择对应分 P；目前没有自动连续播放多分 P 的功能。房间和播放队列保留原始链接。

B 站视频播放无需额外配置。服务器使用 B 站 `platform=html5` 播放接口获取视频元数据和单文件 MP4，接口调用方式参考 [BiliAnalysis](https://github.com/mmyo456/BiliAnalysis)。浏览器使用现有的视频元素（Video Element）直接从 B 站播放文件，视频流量不经过 WebShare。实际画质（Quality）取决于视频及接口响应，B 站仍可能拒绝接口请求。

在房间的搜索平台选择器中选择 **Bilibili**，输入关键词后按回车或点击 **Search**。服务器使用 [biliAPI](https://github.com/renmu123/biliAPI)（`@renmu/bili-api`）获取首页普通视频搜索结果，包含标题、封面、作者和时长。选择结果即可播放，或点击 **Add to Playlist** 加入队列。搜索结果保留视频页面链接，仅在播放视频时解析播放地址。搜索结果缓存 5 分钟，同时发起的相同搜索共享一次请求；搜索失败缓存 30 秒。

默认使用匿名搜索（Anonymous Search）。如果 B 站拒绝搜索，可以在服务器 `.env` 中配置自己的登录凭据（Cookie）`BILIBILI_COOKIE`，然后重启服务器。Cookie 用于搜索和直播画质请求，仅保留在服务器端。服务器必须能够访问 B 站接口，每位观看者仍直接从 B 站加载视频。搜索可用不代表视频一定具有可播放的单文件 MP4 地址。

在同一输入框中粘贴直播间链接，例如 `https://live.bilibili.com/123`，即可观看当前直播。服务器通过 [biliLive-tools](https://github.com/renmu123/biliLive-tools/tree/master/packages/StreamGet)（`@bililive-tools/stream-get`）将直播间短号解析为真实房间编号（Room ID），并获取直播流。服务器会选择 HLS/AVC，优先使用 TS 流，交给现有 HLS 播放器（Player）播放；其中 AVC 指高级视频编码（Advanced Video Coding），TS 指传输流（Transport Stream）。接口返回实际直播流画质。未开播或不可用的房间会显示错误，目前不包含直播搜索。可选的 `BILIBILI_COOKIE` 可以用于获取更高的直播画质，实际可用画质受平台和账号权限影响。

成功的视频播放解析共享并缓存 5 分钟，直播间解析缓存 1 分钟；解析失败缓存 30 秒，以减少重复请求。也支持通过 `b23.tv` 解析直播短链接。房间和队列保留原始直播间链接，让新加入的观看者获得当前播放地址。直播播放复用现有的直播边缘（Live Edge）控制功能。WebShare 不下载、合并、转码（Transcoding）或代理媒体。浏览器直接播放仍取决于内容分发网络（Content Delivery Network，CDN）的跨域资源共享（Cross-Origin Resource Sharing，CORS）策略，以及观看者能否访问该媒体源。

### 音乐（Meting）

音乐功能在现有服务器中使用 Node.js 库 [Meting](https://github.com/metowolf/Meting)，无需单独的解析服务（Resolver Service）。使用房间输入框旁的搜索平台选择器，搜索网易云音乐、QQ 音乐、酷狗音乐或酷我音乐；选择结果即可播放，也可以通过现有的 **Add to Playlist** 按钮加入队列。默认搜索平台仍是 YouTube。

也可以直接粘贴标准歌曲链接：

- 网易云音乐（NetEase）：`https://music.163.com/song?id=...`，包括 `#/song?id=...` 形式的链接。
- QQ 音乐（QQ Music）：`https://y.qq.com/n/ryqq/songDetail/...` 或 `https://y.qq.com/n/yqq/song/....html`。
- 酷狗音乐（KuGou）：`https://www.kugou.com/song/#hash=...`。
- 酷我音乐（Kuwo）：`https://www.kuwo.cn/play_detail/...`。

这些平台的标准歌单链接也受支持：网易云音乐 `/playlist?id=...`、QQ 音乐 `/n/ryqq/playlist/...`、酷狗音乐 `/yy/special/single/....html`，以及酷我音乐 `/playlist_detail/...`。粘贴歌单链接即可浏览歌曲；按回车将返回的歌曲加入房间队列，或选择单首歌曲播放。加入歌单时，房间现有媒体会继续播放。歌单大小和可用性取决于平台响应，目前不包含私有歌单或平台分享短链接解析。

房间保留歌曲链接，并在播放时按需解析当前歌曲；平台提供对应音源时，使用 128 kbps 的码率（Bitrate）。浏览器直接从平台 CDN 播放音频，WebShare 仅处理接口请求，不代理或下载音频。搜索、歌曲和歌单元数据均有缓存，同时发起的相同解析共享一次请求链（Request Chain）；解析失败缓存 30 秒。音乐界面显示歌曲和歌手信息，并在平台提供时展示封面。当可播放音频明显短于歌曲元数据中的时长时，会显示 **Preview only**（仅试听）标签。

音乐界面左侧展示封面和歌曲信息，右侧展示滚动歌词。带时间戳（Timestamp）的 LRC 歌词跟随本地实际播放进度，当前歌词行会高亮并居中；平台提供翻译时也会展示译文。纯文本歌词仍可手动滚动。歌词通过 Meting 独立于音频加载，并缓存 30 分钟；歌词不可用不影响播放。

匿名播放（Anonymous Playback）可能仅返回试听片段，或不返回播放地址。如有需要，可在服务器 `.env` 中使用 `METING_NETEASE_COOKIE`、`METING_TENCENT_COOKIE`、`METING_KUGOU_COOKIE` 或 `METING_KUWO_COOKIE` 配置自己的平台登录 Cookie，然后重启服务器。Cookie 仅保留在服务器端，不会消除账号或平台的权限限制。对于要求特定媒体请求头（Request Headers）、而浏览器无法发送这些请求头的音源，直接播放仍可能失败。当前 Meting 接入不包含咪咕音乐（Migu）、Spotify、Apple Music 导入或自动跨平台匹配（Cross-Platform Matching）。

### Firebase 配置（用户身份验证）

默认关闭登录。启用时使用自己的 Firebase 项目；应用不再默认连接上游账号或分析服务（Analytics）。

项目使用 Firebase 进行身份验证（Authentication），用于用户登录、账号管理、订阅，以及房间锁定和永久房间等功能。

首先在 [Firebase 控制台](https://console.firebase.google.com/) 创建新的应用，或复用已有应用。创建后，点击左侧菜单中「Project overview」旁的齿轮图标，进入项目设置（Project Settings）。向下滚动，创建 Web 应用，并复制 Firebase SDK 配置片段中的 JSON 数据。

接着在浏览器控制台（Browser Console）中执行 `JSON.stringify(PASTE_CONFIG_HERE)`，将配置转换为字符串，再把结果填入 `.env` 中的 `VITE_FIREBASE_CONFIG`。

服务器端验证账号还需要 `FIREBASE_ADMIN_SDK_CONFIG`，按相同方式处理其配置。

### 虚拟浏览器配置

项目支持通过云服务商或 Docker 容器（Container）创建虚拟浏览器，使用 [Neko](https://github.com/m1k1o/neko)。开发时使用 Docker 最方便。

- 安装 Docker：`curl -fsSL https://get.docker.com | sh`。
- 确保服务器已有 SSH 密钥对（SSH Key Pair），其中 `id_rsa` 位于 `~/.ssh` 目录。如果没有，执行 `ssh-keygen` 创建。
- 如果 SSH 用户不是 `root`，配置 `DOCKER_VM_HOST_SSH_USER`。
- 如果网页客户端（Web Client）与服务器不在同一台物理机器上，还需将 `DOCKER_VM_HOST` 设置为可从公网解析的地址，而不是 `localhost`。
- 如果要运行托管实例池（Managed Instance Pool），无论使用云服务还是 Docker，都需配置 `VM_MANAGER_CONFIG`，并运行 vmWorker 服务。

### 房间持久化

- 在 `.env` 中添加 `DATABASE_URL` 来配置 PostgreSQL，使用 [sql/schema.sql](sql/schema.sql) 初始化新数据库结构（Database Schema）。
- 这样即可让房间状态持久化（Persistence），在服务器重启后继续保留。

## 技术栈（Technology Stack）

- React
- TypeScript
- Node.js
- Redis
- PostgreSQL
- Docker

## 可选集成（Optional Integrations）

Discord 账号关联需要配置自己的 `VITE_DISCORD_CLIENT_ID`；授权回调（OAuth Redirect）默认使用当前站点地址。运行自己的建房机器人时，设置 `DISCORD_BOT_TOKEN` 和 `DISCORD_SITE_URL`，可选设置 `DISCORD_API_URL`，然后执行 `node server/discordBot.ts`。

只有同时配置 `STRIPE_SECRET_KEY` 和自己的 `STRIPE_PRICE_ID` 才启用订阅（Subscription）。价格以自己的 Stripe 结账页面为准。后台任务（Workers）与虚拟浏览器基础设施需要单独配置。

屏幕与文件共享、视频聊天默认使用公共 STUN 服务。需要中继（TURN Relay）的网络应在 `VITE_ICE_SERVERS` 中填写自己的 ICE 服务器 JSON 数组并重新构建；配置会提供给客户端，Docker 构建可传入同名 `--build-arg`。

浏览器设置、昵称、标识符（Identifier）和房间密码使用独立的 `webshare-*` 存储键（Storage Key）。

## 来源与许可证（Credits and License）

WebShare 最初使用 [WatchParty](https://github.com/howardchung/watchparty) 的代码。原始版权声明和 MIT 许可证保留在 [LICENSE](LICENSE) 中。可选虚拟浏览器仍依赖第三方镜像（Image）。
