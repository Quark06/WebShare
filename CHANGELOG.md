## October 2026 (WebShare)

- Removed the leftover subscription code (Stripe checkout and billing portal, subscriber sync and Discord subscriber roles). Every user now gets the former subscriber features: custom room URLs, room titles, descriptions and title colors, and up to `PERMANENT_ROOM_LIMIT` permanent rooms (default 20; replaces `FREE_ROOM_LIMIT` and `SUBSCRIBER_ROOM_LIMIT`). The server no longer reserves large virtual browsers and region choice for subscribers. `ROOM_CAPACITY` now covers every room (still only with PostgreSQL); `ROOM_CAPACITY_SUB` is gone.
- Removed relayed screen and file sharing (`MEDIASOUP_SERVER`) and file conversion (`CONVERT_PATH`), which needed outside servers, and Discord account linking (`VITE_DISCORD_CLIENT_ID`, `VITE_OAUTH_REDIRECT_HOSTNAME`), which only granted the subscriber role. The `subscriber` and `link_account` tables and the `isSubRoom` column are no longer used; existing databases can keep or drop them.
- The Screenshare and VBrowser buttons show an under-construction notice while these features are rebuilt. Direct file sharing is unchanged.

- Added a Simplified Chinese interface with a language switch in the top bar and on the Discord login page; the browser remembers the choice, and Chinese browsers start in Chinese.

- Room owners can delete their room from the room toolbar after confirming; everyone is disconnected and the room is removed.
- Rooms now outlive their visitors: an empty or restarted room stops at its playback position and waits for the next visitor to press play.
- Added Join Room, a list of joinable rooms with their current media, viewers and last activity; rooms with no visitors for 72 hours are archived, and with PostgreSQL their links still restore them.

- Added an optional site-wide Discord login gate that admits members of configured Discord servers, fills in their server nickname and avatar, and remembers logins for 30 days.

- Added music search and song-link playback for NetEase Music, QQ Music, KuGou and Kuwo through Meting.
- Added music playlist import into the existing room queue without interrupting the current media.
- Added a music stage with artwork, track information and a preview-only indicator.
- Added scrolling LRC lyrics and translations that follow local playback; missing lyrics do not prevent audio playback.
- Reused room play, pause, seek and automatic queue advancement for music, with playback-position recovery after source resolution.
- Added optional server-side music platform cookies and shared metadata, source and lyric caches.

- Added Bilibili video search, direct video playback and live stream resolution.
- Added Simplified Chinese documentation and a Linux deployment guide.
- Replaced destructive deployment commands with fast-forward updates and a single PM2 application.
- Established WebShare branding and removed upstream accounts, analytics, announcements and deployment presets.
- Adopted independent webshare-* browser storage, a single object chat protocol and current room routes.
