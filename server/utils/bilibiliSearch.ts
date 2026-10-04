import { Auth, Search } from "@renmu/bili-api";
import config from "../config.ts";

const auth = new Auth();
auth.cookie = config.BILIBILI_COOKIE;
const search = new Search(auth);
search.request.defaults.timeout = 15000;

const cache = new Map<
  string,
  { expires: number; result: Promise<PlaylistVideo[]> }
>();
const videos = new Map<string, { expires: number; video: PlaylistVideo }>();

export function getBilibiliSearchVideo(url: string): PlaylistVideo | null {
  const entry = videos.get(url);
  return entry && entry.expires > Date.now() ? entry.video : null;
}

interface BilibiliSearchVideo {
  bvid: string;
  title: string;
  pic: string;
  author: string;
  duration: string;
}

export function searchBilibili(query: string): Promise<PlaylistVideo[]> {
  const keyword = query.trim();
  if (!keyword || keyword.length > 200) {
    throw new Error("Enter a Bilibili search term of up to 200 characters.");
  }
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key);
  }
  for (const [url, entry] of videos) {
    if (entry.expires <= now) videos.delete(url);
  }
  const cached = cache.get(keyword);
  if (cached) return cached.result;

  const result = search
    .type({ keyword, search_type: "video", page: 1, order: "totalrank" })
    .then((data) => {
      if (!Array.isArray(data.result)) {
        throw new Error(
          "Bilibili search is unavailable. Try again later or configure BILIBILI_COOKIE on the server.",
        );
      }
      // Search responses also contain promoted entries without a playable video ID.
      const results = data.result
        .filter((video: BilibiliSearchVideo) => video.bvid)
        .map(
          (video: BilibiliSearchVideo): PlaylistVideo => ({
            url: `https://www.bilibili.com/video/${video.bvid}`,
            name: video.title.replace(/<[^>]*>/g, ""),
            img: video.pic.startsWith("//")
              ? `https:${video.pic}`
              : video.pic.replace(/^http:/, "https:"),
            channel: video.author,
            duration: video.duration
              .split(":")
              .reduce((seconds, part) => seconds * 60 + Number(part), 0),
            type: "bilibili",
          }),
        );
      for (const video of results) {
        videos.set(video.url, { expires: Date.now() + 5 * 60 * 1000, video });
      }
      return results;
    });
  cache.set(keyword, { expires: now + 5 * 60 * 1000, result });
  void result.catch(() => {
    const entry = cache.get(keyword);
    if (entry?.result === result) entry.expires = Date.now() + 30000;
  });
  return result;
}
