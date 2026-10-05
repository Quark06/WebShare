import React, { useEffect, useRef, useState } from "react";
import { parseLyrics, type LyricLine } from "../../utils/lyrics";
import { serverPath } from "../../utils/utils";
import { msg, t } from "../../i18n";
import styles from "./MusicLyrics.module.css";

export function MusicLyrics({
  url,
  getCurrentTime,
}: {
  url: string;
  getCurrentTime: () => number;
}) {
  const [lyrics, setLyrics] = useState<{ lines: LyricLine[]; plain: string[] }>({
    lines: [],
    plain: [],
  });
  const [status, setStatus] = useState(msg("Loading lyrics…"));
  const [active, setActive] = useState(-1);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLyrics({ lines: [], plain: [] });
    setActive(-1);
    setStatus(msg("Loading lyrics…"));
    void (async () => {
      try {
        const response = await fetch(
          `${serverPath}/music/lyrics?url=${encodeURIComponent(url)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error("Lyrics are unavailable.");
        const parsed = parseLyrics(data.lyric, data.tlyric);
        if (controller.signal.aborted) return;
        setLyrics(parsed);
        setStatus(
          parsed.lines.length || parsed.plain.length
            ? ""
            : msg("No lyrics available"),
        );
      } catch {
        if (!controller.signal.aborted)
          setStatus(msg("Lyrics are unavailable"));
      }
    })();
    return () => controller.abort();
  }, [url]);

  useEffect(() => {
    const update = () => {
      const time = getCurrentTime();
      let next = -1;
      for (
        let i = 0;
        i < lyrics.lines.length && lyrics.lines[i].time <= time;
        i++
      )
        next = i;
      setActive(next);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [lyrics.lines, getCurrentTime]);

  useEffect(() => {
    const container = viewport.current;
    const line = container?.querySelector<HTMLElement>('[aria-current="true"]');
    if (container && line)
      container.scrollTo({
        top: line.offsetTop - (container.clientHeight - line.clientHeight) / 2,
        behavior: "smooth",
      });
    else if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  return (
    <section className={styles.panel} aria-label={t("Lyrics")}>
      {status ? (
        <div className={styles.status}>{t(status)}</div>
      ) : (
        <div className={styles.viewport} ref={viewport}>
          {lyrics.lines.length ? (
            <>
              <div className={styles.spacer} aria-hidden="true" />
              {lyrics.lines.map((line, index) => (
                <div
                  key={`${line.time}:${index}`}
                  className={`${styles.line} ${index === active ? styles.active : ""}`}
                  aria-current={index === active ? "true" : undefined}
                  data-lyric-time={line.time}
                >
                  <div>{line.text}</div>
                  {line.translation && (
                    <div className={styles.translation}>{line.translation}</div>
                  )}
                </div>
              ))}
              <div className={styles.spacer} aria-hidden="true" />
            </>
          ) : (
            lyrics.plain.map((line, index) => (
              <div className={styles.line} key={index}>
                {line}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
