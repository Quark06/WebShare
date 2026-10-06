# Configuration

Set `KEY=value` entries in the project's `.env`. Omit unused optional settings. Restart with `npm run pm2`; for `VITE_` settings, run `npm run build` before restarting.

## Media

Cookies are optional. To use your own account, copy the full `Cookie` request header from your signed-in browser and enclose the value in single quotes.

| Setting | Purpose and value |
| --- | --- |
| `BILIBILI_COOKIE` | Bilibili search and live quality; your Bilibili Cookie. |
| `METING_NETEASE_COOKIE` | NetEase Music; your NetEase Cookie. |
| `METING_TENCENT_COOKIE` | QQ Music; your QQ Music Cookie. |
| `METING_KUGOU_COOKIE` | KuGou Music; your KuGou Cookie. |
| `METING_KUWO_COOKIE` | Kuwo Music; your Kuwo Cookie. |
| `YOUTUBE_PROXY_URL` | Proxy for YouTube search, e.g. `http://127.0.0.1:10808`; it must be reachable from the server. |
| `YOUTUBE_API_KEY` | YouTube playlist imports and video information; enable YouTube Data API v3 in [Google Cloud](https://console.cloud.google.com/) and enter its API key. Not needed for search. |

## Third-party resolvers

Resolution defaults to `local`. Set the options below to use third-party services. Replace URLs with compatible services as needed. Media Cookies are used only for local resolution.

| Setting | Purpose | Example |
| --- | --- | --- |
| `BILIBILI_RESOLVER` | Bilibili video resolver | `bilibilix` or `local` |
| `BILIBILI_LIVE_RESOLVER` | Bilibili live resolver | `bilibilix` or `local` |
| `BILIBILIX_URL` | Bilibilix video service URL | `https://www.bilibilix.com` |
| `BILIBILIX_LIVE_URL` | Bilibilix live service URL | `https://live.bilibilix.com` |
| `MUSIC_RESOLVER` | Music resolver | `meting-api` or `local` |
| `METING_API_URL` | Meting service URL | `https://api.qijieya.cn/meting/` |
| `METING_API_PLATFORMS` | Platforms using the service | `netease,tencent` (NetEase and QQ Music); others use local resolution. |

## Discord login gate

Restrict access to members of selected Discord servers. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications). Under **OAuth2 → Redirects**, register `https://your-domain/auth/discord/callback`, or `http://localhost:8080/auth/discord/callback` locally.

| Setting | Value |
| --- | --- |
| `DISCORD_AUTH_CLIENT_ID` | Client ID from the OAuth2 page. |
| `DISCORD_AUTH_CLIENT_SECRET` | Client Secret from the same page. |
| `DISCORD_AUTH_GUILD_ID` | Enable Discord Developer Mode, right-click your server and copy its ID. Separate several IDs with commas; membership in any one is enough. |
| `DISCORD_AUTH_REDIRECT_URI` | Optional exact callback URL registered above. Defaults to the current site address plus `/auth/discord/callback`. |
| `DISCORD_AUTH_SESSION_DAYS` | Optional login duration in days; default `30`. |

All three required values enable the gate. Serve pages and APIs at the same address; use the built site on port `8080` for local login checks.

## Room persistence

Connect an existing PostgreSQL database to keep rooms across restarts. Without a database, restarting clears rooms.

| Setting | Purpose and example |
| --- | --- |
| `DATABASE_URL` | Connection string: `postgresql://USER:PASSWORD@localhost:5432/webshare`. |
| `ROOM_ARCHIVE_HOURS` | Hours before an empty room leaves the list; default `72`. With a database, its original link still restores it. |

Initialize a new database once, replacing the credentials:

```bash
psql 'postgresql://USER:PASSWORD@localhost:5432/webshare' -f sql/schema.sql
```

## Optional services

| Setting | Purpose and value |
| --- | --- |
| `VITE_FIREBASE_CONFIG` | Firebase account login; Web app configuration from Firebase project settings, as single-line JSON enclosed in single quotes. |
| `FIREBASE_ADMIN_SDK_CONFIG` | Firebase server verification; the same project's service account private key JSON, as single-line JSON enclosed in single quotes. |
| `VITE_OAUTH_REDIRECT_HOSTNAME` | Site address for Firebase / Discord account linking, e.g. `https://watch.example.com`; defaults to the current site. |
| `VITE_DISCORD_CLIENT_ID` | Discord account linking for Firebase users; your Discord application Client ID. Separate from the login gate. |
| `DISCORD_BOT_TOKEN`, `DISCORD_SITE_URL` | Room-creation bot token and site address; then run `node server/discordBot.ts`. |
| `DISCORD_API_URL` | Bot API address; defaults to `DISCORD_SITE_URL`. |
| `VITE_ICE_SERVERS` | TURN relay for sharing and video chat; your provider's ICE server JSON, e.g. `'[{"urls":"turn:turn.example.com:3478","username":"USER","credential":"PASSWORD"}]'`. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` | Stripe subscriptions; your Secret Key and Price ID. Requires Firebase login. |
| `DOCKER_VM_HOST`, `DOCKER_VM_HOST_SSH_USER` | Docker host address and SSH user for virtual browsers. Install Docker, configure HTTPS for Neko, and allow the server to connect using `~/.ssh/id_rsa`. |
