import React from "react";
import { Stepper } from "@mantine/core";
import {
  IconBrandBilibili, IconBrandYoutubeFilled, IconMusic,
  IconScreenShare, IconFile, IconLink, IconRefresh,
  IconMessageFilled, IconList, IconVideo, type IconProps,
} from "@tabler/icons-react";
import { NewRoomButton } from "../TopBar/TopBar";
import styles from "./Home.module.css";

export const Home = () => (
  <div className={styles.container}>
    <div className={styles.hero}>
      <div className={styles.heroInner}>
        <div style={{ padding: "30px", flex: 1 }}>
          <h1 className={styles.heroText}>Watch and listen together with WebShare.</h1>
          <div className={styles.subText}>Share Bilibili videos and live streams, music, and YouTube with friends.</div>
          <div className={styles.subText}>Create a room, share its link, and pick something to play.</div>
          <div style={{ marginTop: "24px" }}><NewRoomButton size="xl" /></div>
        </div>
        <img src="/logo.svg" alt="WebShare" width={180} height={180} style={{ margin: "30px" }} />
      </div>
    </div>
    <div className={styles.featureSection}>
      <Feature Icon={IconBrandBilibili} title="Bilibili" text="Search videos or paste a video or live room link." />
      <Feature Icon={IconMusic} title="Music" text="Search songs, import playlists, and follow synchronized lyrics." />
      <Feature Icon={IconBrandYoutubeFilled} title="YouTube" text="Search and watch YouTube videos together." />
      <Feature Icon={IconLink} title="Video links" text="Play a direct video URL or HLS stream." />
      <Feature Icon={IconScreenShare} title="Screen sharing" text="Share a browser tab or your desktop." />
      <Feature Icon={IconFile} title="Local files" text="Share a file from your computer with the room." />
    </div>
    <div className={styles.featureSection}>
      <Feature Icon={IconRefresh} title="Synchronized play" text="Play, pause and seek together." />
      <Feature Icon={IconMessageFilled} title="Chat" text="React to shared moments in room chat." />
      <Feature Icon={IconList} title="Playlists" text="Queue videos and songs without interrupting playback." />
      <Feature Icon={IconVideo} title="Video chat" text="Talk face-to-face while watching together." />
    </div>
    <div style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Stepper active={-1}>
        <Stepper.Step label="Create a room" />
        <Stepper.Step label="Share its link" />
        <Stepper.Step label="Watch or listen together" />
      </Stepper>
    </div>
  </div>
);

const Feature = ({ Icon, title, text }: {
  Icon: React.ForwardRefExoticComponent<IconProps>;
  title: string;
  text: string;
}) => (
  <div style={{ display: "flex", flex: "1 1 0px", flexDirection: "column", alignItems: "center", padding: "20px", minWidth: "180px" }}>
    <Icon size={64} />
    <h2 className={styles.featureTitle}>{title}</h2>
    <div className={styles.featureText}>{text}</div>
  </div>
);
