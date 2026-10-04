import config from "../config.ts";
import {
  PT_HOURS_REGEX,
  PT_MINUTES_REGEX,
  PT_SECONDS_REGEX,
  YOUTUBE_VIDEO_ID_REGEX,
} from "./regex.ts";
import { youtube, youtube_v3 } from "@googleapis/youtube";

let Youtube = config.YOUTUBE_API_KEY
  ? youtube({
      version: "v3",
      auth: config.YOUTUBE_API_KEY,
    })
  : null;

export const mapYoutubeSearchResult = (
  video: youtube_v3.Schema$SearchResult,
): PlaylistVideo => {
  return {
    channel: video.snippet?.channelTitle ?? "",
    url: "https://www.youtube.com/watch?v=" + video?.id?.videoId,
    name: video.snippet?.title ?? "",
    img: video.snippet?.thumbnails?.default?.url ?? "",
    duration: 0,
    type: "youtube",
  };
};

export const mapYoutubeListResult = (
  video: youtube_v3.Schema$Video,
): PlaylistVideo => {
  const videoId = video.id;
  return {
    url: "https://www.youtube.com/watch?v=" + videoId,
    name: video.snippet?.title ?? "",
    img: video.snippet?.thumbnails?.default?.url ?? "",
    channel: video.snippet?.channelTitle ?? "",
    duration: getVideoDuration(video.contentDetails?.duration ?? ""),
    type: "youtube",
  };
};

export const mapYoutubePlaylistResult = (
  item: youtube_v3.Schema$PlaylistItem,
): PlaylistVideo => {
  return {
    url: "https://www.youtube.com/watch?v=" + item.snippet?.resourceId?.videoId,
    name: item.snippet?.title ?? "",
    img: item.snippet?.thumbnails?.default?.url ?? "",
    channel: item.snippet?.channelTitle ?? "",
    duration: 0,
    // duration: getVideoDuration(video.contentDetails?.duration ?? ''),
    type: "youtube",
  };
};

const searchCache = new Map<
  string,
  { expires: number; result: Promise<PlaylistVideo[]> }
>();

export const searchYoutube = async (
  query: string,
): Promise<PlaylistVideo[]> => {
  if (!Youtube)
    throw new Error("YouTube search requires YOUTUBE_API_KEY on the server.");
  const keyword = query.trim();
  if (!keyword || keyword.length > 200) {
    throw new Error("Enter a YouTube search term of up to 200 characters.");
  }
  const now = Date.now();
  for (const [key, entry] of searchCache) {
    if (entry.expires <= now) searchCache.delete(key);
  }
  const cached = searchCache.get(keyword);
  if (cached) return cached.result;
  const result = Youtube.search
    .list({
      part: ["snippet"],
      type: ["video"],
      maxResults: 25,
      q: keyword,
      videoEmbeddable: "true",
    })
    .then((response) => response.data.items?.map(mapYoutubeSearchResult) ?? []);
  searchCache.set(keyword, { expires: now + 5 * 60 * 1000, result });
  void result.catch(() => {
    const entry = searchCache.get(keyword);
    if (entry?.result === result) entry.expires = Date.now() + 30000;
  });
  return result;
};

export const youtubePlaylist = async (
  playlistId: string,
): Promise<PlaylistVideo[]> => {
  const response = await Youtube?.playlistItems.list({
    part: ["snippet"],
    playlistId,
    maxResults: 100,
  });
  return response?.data?.items?.map(mapYoutubePlaylistResult) ?? [];
};

export const getYoutubeVideoID = (url: string) => {
  const idParts = YOUTUBE_VIDEO_ID_REGEX.exec(url);
  if (!idParts) {
    return;
  }

  const id = idParts[1];
  if (!id) {
    return;
  }

  return id;
};

export const fetchYoutubeVideo = async (
  id: string,
): Promise<PlaylistVideo | null> => {
  const response = await Youtube?.videos.list({
    part: ["snippet", "contentDetails"],
    id: [id],
  });
  const top = response?.data?.items?.[0];
  return top ? mapYoutubeListResult(top) : null;
};

export const getVideoDuration = (string: string): number => {
  if (!string) {
    return 0;
  }
  const hoursParts = PT_HOURS_REGEX.exec(string);
  const minutesParts = PT_MINUTES_REGEX.exec(string);
  const secondsParts = PT_SECONDS_REGEX.exec(string);

  const hours = hoursParts ? parseInt(hoursParts[1]) : 0;
  const minutes = minutesParts ? parseInt(minutesParts[1]) : 0;
  const seconds = secondsParts ? parseInt(secondsParts[1]) : 0;

  const totalSeconds = seconds + minutes * 60 + hours * 60 * 60;
  return totalSeconds;
};

export const isYouTube = (input: string) => {
  return (
    input.startsWith("https://www.youtube.com/") ||
    input.startsWith("https://youtu.be/")
  );
};
