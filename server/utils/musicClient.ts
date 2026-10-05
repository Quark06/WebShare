import Meting from "@meting/core";
import config from "../config.ts";
import type { MusicPlatform } from "../../src/utils/music.ts";
import { MetingApiClient } from "./resolvers/metingApi.ts";

// Adapters provide the same normalized songs, lyrics and media data that the
// existing music pipeline expects, independently of their transport/service.
export type MusicClient = Pick<
  Meting,
  "raw" | "error" | "info" | "search" | "song" | "playlist" | "url" | "lyric"
>;

const providers = {
  local(platform: MusicPlatform): MusicClient {
    const meting = new Meting(platform).format(true);
    const cookie =
      config[
        `METING_${platform.toUpperCase()}_COOKIE` as `METING_${Uppercase<MusicPlatform>}_COOKIE`
      ];
    if (cookie) meting.cookie(cookie);
    return meting;
  },
  "meting-api"(platform: MusicPlatform): MusicClient {
    const supported = config.METING_API_PLATFORMS.split(",").map((name) =>
      name.trim(),
    );
    return supported.includes(platform)
      ? new MetingApiClient(platform, config.METING_API_URL)
      : providers.local(platform);
  },
};

export function createMusicClient(platform: MusicPlatform): MusicClient {
  const provider = providers[config.MUSIC_RESOLVER as keyof typeof providers];
  if (!provider) {
    throw new Error(`Unknown MUSIC_RESOLVER: ${config.MUSIC_RESOLVER}.`);
  }
  return provider(platform);
}
