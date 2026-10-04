declare module "@meting/core" {
  export default class Meting {
    constructor(platform: string);
    raw: string | null;
    error: string | null;
    info: { statusCode: number } | null;
    format(enabled: boolean): this;
    cookie(value: string): this;
    search(
      query: string,
      options: { page: number; limit: number },
    ): Promise<string>;
    song(id: string): Promise<string>;
    playlist(id: string): Promise<string>;
    url(id: string, bitrate: number): Promise<string>;
    lyric(id: string): Promise<string>;
  }
}

interface YoutubeResult {
  kind: string;
  etag: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
        height: number;
      };
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
      standard: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    tags: string[];
    categoryId: string;
    liveBroadcastContent: string;
    localized: {
      title: string;
      description: string;
    };
    defaultAudioLanguage: string;
  };
}
