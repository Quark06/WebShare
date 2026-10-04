import { MediaPlayerClass } from "dashjs";
import { Player } from "./Player";

export class YouTube implements Player {
  youtubePlayer: YT.Player | null;
  constructor(youtubePlayer: YT.Player | null) {
    this.youtubePlayer = youtubePlayer;
  }
  clearDashState = () => {};
  setDashState = (player: MediaPlayerClass) => {};

  getCurrentTime = () => {
    return this.youtubePlayer?.getCurrentTime() ?? 0;
  };

  getDuration = () => {
    return this.youtubePlayer?.getDuration() ?? 0;
  };

  isMuted = () => {
    return this.youtubePlayer?.isMuted() ?? false;
  };

  isSubtitled = (): boolean => {
    // This actually isn't accurate after subtitles have been toggled off because track doesn't update
    // try {
    //   const current = this.youtubePlayer?.getOption('captions', 'track');
    //   return Boolean(current && current.languageCode);
    // } catch (e) {
    //   console.warn(e);
    //   return false;
    // }
    return false;
  };

  getPlaybackRate = (): number => {
    return this.youtubePlayer?.getPlaybackRate() ?? 1;
  };

  setPlaybackRate = (rate: number) => {
    this.youtubePlayer?.setPlaybackRate(rate);
  };

  setSrcAndTime = async (src: string, time: number) => {
    let url = new window.URL(src);
    // Standard link https://www.youtube.com/watch?v=ID
    let videoId = new URLSearchParams(url.search).get("v");
    // Link shortener https://youtu.be/ID
    let altVideoId = src.split("/").slice(-1)[0].split("?")[0];
    this.youtubePlayer?.cueVideoById(videoId || altVideoId, time);
    // this.youtubePlayer?.cuePlaylist({listType: 'playlist', list: 'OLAK5uy_mtoaOGQksRdPbwlNtQ9IiK67wir5QqyIc'});
  };

  playVideo = async () => {
    setTimeout(() => {
      console.log("play yt");
      this.youtubePlayer?.playVideo();
    }, 200);
  };

  pauseVideo = () => {
    this.youtubePlayer?.pauseVideo();
  };

  seekVideo = (time: number) => {
    this.youtubePlayer?.seekTo(time, true);
  };

  shouldPlay = () => {
    return (
      this.youtubePlayer?.getPlayerState() ===
        window.YT?.PlayerState.PAUSED ||
      this.getCurrentTime() === this.getDuration()
    );
  };

  setMute = (muted: boolean) => {
    if (muted) {
      this.youtubePlayer?.mute();
    } else {
      this.youtubePlayer?.unMute();
    }
  };

  setVolume = (volume: number) => {
    this.youtubePlayer?.setVolume(volume * 100);
  };

  getVolume = (): number => {
    const volume = this.youtubePlayer?.getVolume();
    return (volume ?? 0) / 100;
  };

  setSubtitleMode = (mode?: TextTrackMode, lang?: string) => {
    // Show the available options
    // console.log(this.youtubePlayer?.getOptions('captions'));
    if (mode === "showing") {
      console.log(lang);
      //@ts-expect-error
      this.youtubePlayer?.setOption("captions", "reload", true);
      //@ts-expect-error
      this.youtubePlayer?.setOption("captions", "track", {
        languageCode: lang ?? "en",
      });
    }
    if (mode === "hidden") {
      // BUG this doesn't actually set the value of track
      // so we can't determine if subtitles are on or off
      // need to provide separate menu options
      //@ts-expect-error
      this.youtubePlayer?.setOption("captions", "track", {});
    }
  };

  getSubtitleMode = () => {
    return "hidden" as TextTrackMode;
  };

  isReady = () => {
    return Boolean(this.youtubePlayer);
  };

  stopVideo = () => {
    this.youtubePlayer?.stopVideo();
  };

  clearState = () => {
    return;
  };

  loadSubtitles = async (src: string) => {
    return;
  };

  syncSubtitles = (sharerTime: number) => {
    return;
  };

  getTimeRanges = (): { start: number; end: number }[] => {
    return [
      {
        start: 0,
        end:
          (this.youtubePlayer?.getVideoLoadedFraction() ?? 0) *
          this.getDuration(),
      },
    ];
  };

  setLoop = (loop: boolean): void => {
    this.youtubePlayer?.setLoop(loop);
  };

  getVideoEl = (): HTMLMediaElement => {
    return document.getElementById("leftYt") as HTMLMediaElement;
  };
}
