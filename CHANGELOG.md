## October 2026 (WebShare)

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
