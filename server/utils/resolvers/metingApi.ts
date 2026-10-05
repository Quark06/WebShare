import type { MusicPlatform } from "../../../src/utils/music.ts";
import type { MusicClient } from "../musicClient.ts";
import { resolverMediaUrl, resolverText } from "./http.ts";

interface SongEndpoints {
  url?: string;
  lrc?: string;
  expires: number;
}

// Retain URLs returned by song/search/playlist responses, including any
// service-specific query parameters. No extra request per imported song.
const endpoints = new Map<string, SongEndpoints>();

export class MetingApiClient implements MusicClient {
  raw: string | null = null;
  error: string | null = null;
  info: { statusCode: number } | null = null;
  private platform: MusicPlatform;
  private endpoint: string;

  constructor(platform: MusicPlatform, endpoint: string) {
    this.platform = platform;
    this.endpoint = endpoint;
  }

  private key(id: string): string {
    return `${this.endpoint}:${this.platform}:${id}`;
  }

  private apiUrl(
    type: string,
    id: string,
    params: Record<string, string> = {},
  ): URL {
    const url = new URL(this.endpoint);
    for (const [key, value] of Object.entries({
      server: this.platform,
      type,
      id,
      ...params,
    })) {
      url.searchParams.set(key, value);
    }
    return url;
  }

  private songEndpoints(id: string): SongEndpoints | undefined {
    const entry = endpoints.get(this.key(id));
    return entry && entry.expires > Date.now() ? entry : undefined;
  }

  private async metadata(
    type: string,
    id: string,
    params?: Record<string, string>,
  ): Promise<string> {
    const text = await resolverText(this.apiUrl(type, id, params));
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error("Meting API returned invalid song metadata.");
    }
    const now = Date.now();
    for (const [key, entry] of endpoints) {
      if (entry.expires <= now) endpoints.delete(key);
    }
    const songs = data.map((item) => {
      const songId = String(
        item.id ??
          (item.url
            ? new URL(item.url, this.endpoint).searchParams.get("id")
            : null) ??
          (type === "song" ? id : ""),
      );
      if (!songId) throw new Error("Meting API returned a song without an ID.");
      endpoints.set(this.key(songId), {
        url: item.url ? new URL(item.url, this.endpoint).toString() : undefined,
        lrc: item.lrc ? new URL(item.lrc, this.endpoint).toString() : undefined,
        expires: now + 5 * 60 * 1000,
      });
      return {
        ...item,
        id: songId,
        name: item.name,
        artist: Array.isArray(item.artist)
          ? item.artist
          : item.artist
            ? [String(item.artist)]
            : [],
        album: item.album,
      };
    });
    // Keep cover/duration fields available to the existing metadata mapper.
    this.raw = JSON.stringify({ data: songs });
    this.info = { statusCode: 200 };
    return JSON.stringify(songs);
  }

  search(query: string, options: { page: number; limit: number }): Promise<string> {
    return this.metadata("search", query, {
      page: String(options.page),
      limit: String(options.limit),
    });
  }

  song(id: string): Promise<string> {
    return this.metadata("song", id);
  }

  playlist(id: string): Promise<string> {
    return this.metadata("playlist", id);
  }

  async url(id: string, bitrate: number): Promise<string> {
    const url = new URL(
      this.songEndpoints(id)?.url || this.apiUrl("url", id).toString(),
    );
    // Only add API parameters to resolver URLs, never to an already resolved CDN URL.
    if (url.searchParams.get("type") === "url") url.searchParams.set("br", String(bitrate));
    const isMedia = /\.(mp3|m4a|aac|ogg|flac|wav)$/i.test(url.pathname);
    const source = isMedia ? url.toString() : await resolverMediaUrl(url);
    this.info = { statusCode: 200 };
    return JSON.stringify({ url: source, br: bitrate });
  }

  async lyric(id: string): Promise<string> {
    const url = this.songEndpoints(id)?.lrc || this.apiUrl("lrc", id);
    const text = await resolverText(url);
    this.info = { statusCode: 200 };
    if (text.trim().startsWith("{")) {
      const data = JSON.parse(text);
      return JSON.stringify({
        lyric: data.lyric || data.lrc || "",
        tlyric: data.tlyric || "",
      });
    }
    return JSON.stringify({ lyric: text, tlyric: "" });
  }
}
