import { BilibiliParser } from "@bililive-tools/stream-get";
import { Live } from "@renmu/bili-api";
import config from "../config.ts";
import type { BilibiliMedia } from "./bilibili.ts";

const parser = new BilibiliParser({
  timeout: 15000,
  headers: { Referer: "https://live.bilibili.com/" },
});
const live = new Live();
live.request.defaults.timeout = 15000;

export async function extractBilibiliLive(
  pageUrl: string,
): Promise<BilibiliMedia> {
  const roomId = await parser.extractRoomId(pageUrl);
  // stream-get 0.4.1 reads room metadata over HTTP, which Bilibili rejects.
  // Use the existing HTTPS metadata API and keep stream extraction in stream-get.
  const info = await live.getRoomInfo(Number(roomId), false);
  if (info.live_status !== 1) {
    throw new Error("This Bilibili room is not live or is unavailable.");
  }
  const sources = await parser.getStreams(roomId, {
    cookie: config.BILIBILI_COOKIE || undefined,
  });
  const streams = sources
    .flatMap((source) => source.streams)
    .filter(
      (stream) =>
        stream.protocol === "http_hls" &&
        stream.codec === "avc" &&
        ["ts", "fmp4"].includes(stream.format),
    );
  // currentQn is the actual URL quality; accepted qualities share that URL.
  streams.sort(
    (a, b) =>
      Number(b.format === "ts") - Number(a.format === "ts") ||
      Number(b.currentQn) - Number(a.currentQn),
  );
  const stream = streams[0];
  if (!stream) {
    throw new Error(
      "No browser-compatible HLS/AVC source is available for this Bilibili live room.",
    );
  }
  const url = new URL(stream.url);
  url.protocol = "https:";
  return {
    title: info.title,
    duration: 0,
    quality: stream.currentQn,
    url: url.toString(),
    format: "hls",
    isLive: true,
  };
}
