# WebShare

[English](README.md) | [简体中文](README.zh-CN.md)

![screenshot](https://github.com/howardchung/watchparty/raw/master/public/screenshot_full.png)

A website for watching videos and listening to music together, based on [WatchParty](https://github.com/howardchung/watchparty).

## Description

- Synchronizes the video being watched with the current room
- Plays, pauses, and seeks are synced to all watchers
- Supports:
  - Screen sharing (full screen, browser tab or application)
  - Launch a shared virtual browser in the cloud (similar to rabb.it)
  - Stream-your-own-file
  - Video files on the Internet (anything accessible via HTTP)
  - YouTube videos
  - Bilibili video search and links (direct HTML5 single-file MP4 playback)
  - Bilibili live room links (direct HLS/AVC playback via `@bililive-tools/stream-get`)
  - Music song links and playlists from NetEase, QQ Music, KuGou and Kuwo (via Meting)
  - Magnet links (via WebTorrent)
  - .m3u8 streams (HLS)
- Create separate rooms for users on demand
- Text chat
- Video chat

## Quick Start

- Use Node.js 24 or newer.
- Clone this repo via `git clone git@github.com:Quark06/WebShare.git` and enter the `WebShare` directory.
- Duplicate `.env.example` as `.env` and add config for the features you want as described in the advanced setup.
- Install npm dependencies for the project via `npm ci`
- Start the server via `npm run dev`
  - Defaults to port 8080, customize with `PORT` env var
  - Set `SSL_KEY_FILE` and `SSL_CRT_FILE` for HTTPS.
- Start the React application in a separate shell and port via `npm run ui`
  - Point to server using `VITE_SERVER_HOST` env var if you customized it above
  - Set `SSL_KEY_FILE` and `SSL_CRT_FILE` for HTTPS.
  - HTTPS is required by the browser for some WebRTC features (camera, etc.)

For a production build, run `npm run build`, then start the server with `NODE_ENV=production` and `npm start`. The same server serves the built frontend and the API on port 8080 by default.

## Server deployment

See the [server deployment guide (简体中文)](docs/DEPLOYMENT.zh-CN.md) for Linux/PM2, Nginx/HTTPS, Docker, updates, deployment audit findings and functional acceptance checks.

Use `npm run pm2` for the single production `webshare` process. On an existing server, `npm run deploy` requires a clean `master` branch, pulls with fast-forward only, installs dependencies, builds and type-checks, then starts or restarts only `webshare`. GitHub Actions currently checks builds; it does not deploy to your server.

## Advanced Setup (optional)

All of these are optional and the application should work without them. Some functionality may be missing.

### YouTube video search

Video search uses [YouTube.js](https://github.com/LuanRT/YouTube.js) (`youtubei.js`) on the server. Search works without a Google API key or a YouTube login.

Choose **YouTube** in the room's search-platform selector, enter keywords and press Enter or click **Search**. Select a result to play it, or use **Add to Playlist**. Video search runs only when submitted; direct links can still be pasted on any search platform. Search returns up to 25 ordinary videos from the first page, with titles, covers, authors and durations. Identical searches share a five-minute cache; search failures are cached for 30 seconds and shown in the search box. Adding a recently searched video to the playlist reuses its search metadata without an API key.

The server must be able to reach YouTube. YouTube.js uses YouTube's internal API, which can change or reject requests. Search results do not guarantee that a video allows embedded playback. Each viewer still plays video through the existing YouTube iframe using their own network.

YouTube search requests use an HTTP(S) proxy when configured. The priority is `YOUTUBE_PROXY_URL` in the server environment, then `HTTPS_PROXY` / `HTTP_PROXY` (including lowercase variants, with `NO_PROXY` supported), then the enabled Windows manual system proxy. For example, set `YOUTUBE_PROXY_URL=http://127.0.0.1:10808` in the server `.env` and restart. On Windows, the enabled system proxy is detected automatically, so TUN mode is not required for search. Proxy selection is read once per server process; restart after changing proxy settings. If no proxy is configured, requests connect directly.

### Optional YouTube Data API

`YOUTUBE_API_KEY` remains optional for fetching metadata when adding an unsearched YouTube link and for importing YouTube playlists. Enable **YouTube Data API v3** in [Google Cloud](https://console.cloud.google.com/), create an API key, set `YOUTUBE_API_KEY` in the server `.env`, and restart the server. Keyword searches always use YouTube.js, even when this key is configured.

### Bilibili videos

Paste an ordinary Bilibili video URL (`bilibili.com/video/BV...`, `av...`, or a `b23.tv` short link) into the existing room input. An explicit `?p=2` selects that part; automatic multi-part playback is not added. The room and playlist retain the original link.

Bilibili playback works without additional configuration. The server requests video metadata and a single-file MP4 using Bilibili's `platform=html5` playback API, following the API approach described in [BiliAnalysis](https://github.com/mmyo456/BiliAnalysis). The browser plays the file directly from Bilibili with the existing video element. Video traffic does not pass through WebShare. Actual quality depends on the video and API response, and API requests can still be rejected by Bilibili.

Choose **Bilibili** in the room's search-platform selector, enter keywords and press Enter or click **Search**. Search uses [biliAPI](https://github.com/renmu123/biliAPI) (`@renmu/bili-api`) on the server to fetch the first page of ordinary video results, with titles, covers, authors and durations. Select a result to play it or use **Add to Playlist**. Results retain the video page URL; playback URLs are resolved only when a video is played. Search results are cached for five minutes, with concurrent identical searches sharing one request. Search failures are cached for 30 seconds.

Anonymous search is the default. If Bilibili rejects searches, you can configure your own `BILIBILI_COOKIE` in the server `.env` and restart. The Cookie is used for search and live stream quality requests and remains on the server. The server must be able to reach Bilibili's APIs; each viewer still loads video directly from Bilibili. Search availability does not guarantee that a video has a playable single-file MP4 source.

Paste a live room link such as `https://live.bilibili.com/123` into the same input to watch a current live broadcast. The server resolves short room IDs and obtains streams through [biliLive-tools](https://github.com/renmu123/biliLive-tools/tree/master/packages/StreamGet) (`@bililive-tools/stream-get`). It selects HLS/AVC, preferring TS streams, for the existing HLS player. The response reports the actual stream quality. Offline or unavailable rooms show an error; live search is not included. Optional `BILIBILI_COOKIE` can enable higher live qualities subject to platform/account availability.

Successful playback resolutions are shared and cached for five minutes for videos and one minute for live rooms; failed resolutions are cached for 30 seconds to reduce repeated requests. Live short links through `b23.tv` are also resolved. The room and playlist keep the original room link so joining viewers obtain a current playback URL. Live playback uses the existing live-edge controls. WebShare does not download, merge, transcode, or proxy the media. Direct browser playback still depends on the stream CDN's CORS policy and availability to the viewer.

### Music (Meting)

Music uses the Node.js library [Meting](https://github.com/metowolf/Meting) inside the existing server. No separate resolver service is required. Use the search-platform selector beside the room input to search NetEase, QQ Music, KuGou or Kuwo; select a result to play it or use its existing **Add to Playlist** button. YouTube remains the default search platform.

You can also paste standard song links directly:

- NetEase: `https://music.163.com/song?id=...` (including `#/song?id=...` links)
- QQ Music: `https://y.qq.com/n/ryqq/songDetail/...` or `https://y.qq.com/n/yqq/song/....html`
- KuGou: `https://www.kugou.com/song/#hash=...`
- Kuwo: `https://www.kuwo.cn/play_detail/...`

Standard playlist links are supported for the same platforms: NetEase `/playlist?id=...`, QQ Music `/n/ryqq/playlist/...`, KuGou `/yy/special/single/....html`, and Kuwo `/playlist_detail/...`. Paste one to browse its tracks; press Enter to add the returned tracks to the room queue, or select an individual track to play it. The existing room media keeps playing while a playlist is added. Playlist size and availability depend on the platform response; private playlists and platform share-short-link resolution are not included.

The room retains song links and resolves the current song on demand at 128 kbps where available. The browser plays audio directly from the platform CDN; WebShare only handles API requests and does not proxy or download audio. Search, track and playlist metadata are cached, and concurrent resolutions share one request chain. Cached failures are retained for 30 seconds. The music stage shows the song and artist, with artwork where available. A **Preview only** label appears when the playable audio is substantially shorter than the track metadata.

The music stage places the artwork and song information on the left, with scrolling lyrics on the right. Timestamped LRC lyrics follow the actual local playback position, highlighting and centering the current line; translations are shown when supplied by the platform. Plain lyrics remain manually scrollable. Lyrics load independently of the audio through Meting and are cached for 30 minutes; unavailable lyrics do not prevent playback.

Anonymous playback may return a preview or no URL. If needed, configure your own platform login Cookie in the server `.env` with `METING_NETEASE_COOKIE`, `METING_TENCENT_COOKIE`, `METING_KUGOU_COOKIE`, or `METING_KUWO_COOKIE`, then restart the server. Cookies stay on the server and do not remove account or platform restrictions. Sources requiring media request headers that the browser cannot send may still fail direct playback. Migu, Spotify and Apple Music import and automatic cross-platform matching are not part of this initial Meting integration.

### Firebase Config (user authentication)

This project uses Firebase for authentication. This is used for user login, account management, subscriptions, and handling some features like room locking/permanence.

To set up, create a new Firebase app (or reuse an old one) from [here](https://console.firebase.google.com/). After creating an application, click on the settings cog icon in the left menu next to "Project overview" and click on project settings. From there, scroll down, create a web application and copy the Firebase SDK configuration snippet JSON data.

Next, you have to stringify it: `JSON.stringify(PASTE_CONFIG_HERE)` in your browser console, then add it to `VITE_FIREBASE_CONFIG` in your .env file.

For server verification of accounts you'll also need `FIREBASE_ADMIN_SDK_CONFIG`, which you should do the same steps for.

### Virtual Browser Setup

This project supports creating virtual browsers (using https://github.com/m1k1o/neko) either on a cloud provider or with Docker containers. For development, Docker is easiest.

- Install Docker: `curl -fsSL https://get.docker.com | sh`
- Make sure you have an SSH key pair set up on the server (`id_rsa` in `~/.ssh` directory), if not, use `ssh-keygen`.
- Configure `DOCKER_VM_HOST_SSH_USER` if `root` is not the correct user
- Note: If your web client is not running on the same physical machine as the server, you will also need to configure `DOCKER_VM_HOST` to a publically-resolvable value (i.e. not localhost)
- If you want to run managed instance pools (whether on cloud or with Docker), configure `VM_MANAGER_CONFIG` and run the vmWorker service.

### Room Persistence

- Configure Postgres by adding DATABASE_URL to your .env file and then setting up the database schema
- This allows rooms to persist between server restarts

## Tech

- React
- TypeScript
- Node.js
- Redis
- PostgreSQL
- Docker
