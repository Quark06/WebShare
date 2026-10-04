import { extractBilibiliLive } from "./bilibiliLive.ts";

const cache = new Map<
  string,
  { expires: number; result: Promise<BilibiliMedia> }
>();

export interface BilibiliMedia {
  title: string;
  duration: number;
  quality?: number;
  url: string;
  format?: "hls";
  isLive?: boolean;
}

export function normalizeBilibiliUrl(input: string): string {
  const url = new URL(input);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Enter a Bilibili video or live room URL.");
  }
  if (url.hostname === "live.bilibili.com") {
    const roomId = url.pathname.match(/^\/(\d+)\/?$/)?.[1];
    if (!roomId || Number(roomId) <= 0) {
      throw new Error("Enter a Bilibili live room URL with a room number.");
    }
    return `https://live.bilibili.com/${roomId}`;
  }
  if (url.hostname === "b23.tv") {
    if (!/^\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) {
      throw new Error("Enter a Bilibili video short link.");
    }
    return `https://b23.tv${url.pathname}`;
  }
  if (
    !["bilibili.com", "www.bilibili.com", "m.bilibili.com"].includes(url.hostname)
  ) {
    throw new Error("Enter a Bilibili video or live room URL.");
  }
  const id = url.pathname.match(
    /^\/video\/(BV[a-zA-Z0-9]{10}|av\d+)\/?$/,
  )?.[1];
  if (!id) throw new Error("Only ordinary Bilibili videos are supported.");
  const part = Number(url.searchParams.get("p") || 1);
  if (!Number.isInteger(part) || part < 1) throw new Error("Invalid video part.");
  return `https://www.bilibili.com/video/${id}${part > 1 ? `?p=${part}` : ""}`;
}

async function biliJson(url: URL): Promise<any> {
  const response = await fetch(url, {
    headers: {
      Referer: "https://www.bilibili.com/",
      "User-Agent": "Mozilla/5.0",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Bilibili API returned HTTP ${response.status}. Try again later.`);
  }
  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error("Bilibili API returned an invalid response. Try again later.");
  }
  if (json.code !== 0) {
    throw new Error(`Bilibili API error ${json.code}: ${json.message || "Resolution failed."}`);
  }
  return json.data;
}

async function extract(input: string): Promise<BilibiliMedia> {
  let pageUrl = input;
  if (new URL(pageUrl).hostname === "b23.tv") {
    const response = await fetch(pageUrl, { signal: AbortSignal.timeout(15000) });
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Bilibili short link returned HTTP ${response.status}.`);
    pageUrl = normalizeBilibiliUrl(response.url);
  }
  const page = new URL(pageUrl);
  if (page.hostname === "live.bilibili.com") {
    return extractBilibiliLive(pageUrl);
  }
  const id = page.pathname.slice("/video/".length);
  const part = Number(page.searchParams.get("p") || 1);
  const metadataUrl = new URL("https://api.bilibili.com/x/web-interface/view");
  metadataUrl.searchParams.set(id.startsWith("av") ? "aid" : "bvid", id.startsWith("av") ? id.slice(2) : id);
  const metadata = await biliJson(metadataUrl);
  const selected = metadata.pages?.[part - 1];
  if (!selected?.cid) throw new Error("Invalid video part or unavailable Bilibili video.");
  const playUrl = new URL("https://api.bilibili.com/x/player/playurl");
  playUrl.search = new URLSearchParams({
    bvid: metadata.bvid,
    cid: String(selected.cid),
    qn: "116",
    otype: "json",
    platform: "html5",
    high_quality: "1",
  }).toString();
  const playback = await biliJson(playUrl);
  const videoUrl = playback.durl?.[0]?.url;
  if (playback.durl?.length !== 1 || !videoUrl || !new URL(videoUrl).pathname.endsWith(".mp4")) {
    throw new Error("No single-file MP4 source is available for this Bilibili video.");
  }
  const duration = Number(playback.timelength) / 1000;
  if (!(duration > 0 && Number.isFinite(duration))) {
    throw new Error("Only Bilibili video on demand is supported.");
  }
  return {
    title: part > 1 ? `${metadata.title} p${part} ${selected.part}` : metadata.title,
    duration,
    quality: playback.quality,
    url: videoUrl,
  };
}

export function resolveBilibili(input: string): Promise<BilibiliMedia> {
  const pageUrl = normalizeBilibiliUrl(input);
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key);
  }
  const cached = cache.get(pageUrl);
  if (cached) return cached.result;
  const result = extract(pageUrl);
  cache.set(pageUrl, { expires: now + 5 * 60 * 1000, result });
  void result.then(
    (media) => {
      const entry = cache.get(pageUrl);
      if (entry?.result === result) {
        entry.expires = Date.now() + (media.isLive ? 60000 : 5 * 60 * 1000);
      }
    },
    () => {
      const entry = cache.get(pageUrl);
      if (entry?.result === result) entry.expires = Date.now() + 30000;
    },
  );
  return result;
}
