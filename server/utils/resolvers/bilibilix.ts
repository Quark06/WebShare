import config from "../../config.ts";
import type { BilibiliMedia } from "../bilibili.ts";
import { getBilibiliSearchVideo } from "../bilibiliSearch.ts";
import { resolverMediaUrl } from "./http.ts";

export async function resolveBilibilix(pageUrl: string): Promise<BilibiliMedia> {
  const page = new URL(pageUrl);
  const isLive = page.hostname === "live.bilibili.com";
  const endpoint = new URL(
    isLive ? config.BILIBILIX_LIVE_URL : config.BILIBILIX_URL,
  );
  // Preserve the original video path and part; allow a replacement service
  // to use a path prefix or fixed query parameters in its configured URL.
  endpoint.pathname = endpoint.pathname.replace(/\/$/, "") + page.pathname;
  page.searchParams.forEach((value, key) => endpoint.searchParams.set(key, value));
  const mediaUrl = await resolverMediaUrl(endpoint);
  const media = new URL(mediaUrl);
  const isHls = media.pathname.endsWith(".m3u8");
  if (!isHls && !media.pathname.endsWith(".mp4")) {
    throw new Error(
      "Bilibilix did not return a browser-compatible MP4 or HLS source.",
    );
  }
  const metadata = getBilibiliSearchVideo(pageUrl);
  return {
    title:
      metadata?.name ||
      (isLive
        ? `Bilibili live ${page.pathname.slice(1)}`
        : `Bilibili ${page.pathname.slice("/video/".length)}${page.search}`),
    duration: isLive ? 0 : metadata?.duration || 0,
    url: mediaUrl,
    ...(isHls ? { format: "hls" as const } : {}),
    isLive,
    resolver: "bilibilix",
  };
}
