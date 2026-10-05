import React from "react";
import { t } from "../../i18n";

const pageStyle: React.CSSProperties = {
  maxWidth: "100%", width: "800px", padding: "20px", margin: "0 auto",
};

// Places an element where {name} appears in a translated sentence
const withElement = (text: string, name: string, element: React.ReactNode) => {
  const [before, after] = text.split(`{${name}}`);
  return <>{before}{element}{after}</>;
};

export const Privacy = () => (
  <div style={pageStyle}>
    <h1>{t("Privacy and data")}</h1>
    <p>{t("WebShare can be used without an account. If this site enables login, its configured authentication provider handles your account.")}</p>
    <p>{t("Your browser stores settings, a client identifier, your display name and saved room passwords. Room participants can see your name, messages and shared media links.")}</p>
    <p>{t("The server processes room state and messages. A deployment with a database can save room data between restarts. The operator controls server logs and data retention.")}</p>
    <p>{t("Video, live stream and music searches send requests to their respective platforms. Direct playback connects your browser to the media provider. Providers such as YouTube, Bilibili, music platforms and avatar services have their own privacy practices.")}</p>
    <p>{t("Camera, screen and file sharing connect room participants through WebRTC.")}</p>
    <p>{t("Contact the operator of this site for account or data requests. WebShare does not include a default analytics service.")}</p>
  </div>
);

export const Terms = () => (
  <div style={pageStyle}>
    <h1>{t("Using WebShare")}</h1>
    <p>{t("Share media and files you are allowed to share, and respect other room participants.")}</p>
    <p>{withElement(t("Media platforms control content availability and playback permissions. YouTube usage is subject to the {link}."), "link", <a href="https://www.youtube.com/t/terms">{t("YouTube Terms of Service")}</a>)}</p>
    <p>{t("Room links can be shared with other people. Use available room controls to manage access.")}</p>
    <p>{t("Available features depend on this site's configuration. Contact its operator for service questions.")}</p>
  </div>
);

export const FAQ = () => (
  <div style={pageStyle}>
    <h1>{t("FAQ")}</h1>
    <h2>{t("How do I watch with friends?")}</h2>
    <p>{t("Create a room and share its link. Search for media or paste a supported video, music or Bilibili live room link.")}</p>
    <h2>{t("Does media pass through WebShare?")}</h2>
    <p>{t("Bilibili video, live and music playback connect directly to the platform. WebShare handles searches, link resolution, chat and room synchronization. Screen sharing, local file sharing and virtual browsers use their own connections.")}</p>
    <h2>{t("Why does a song stop early or a live room fail?")}</h2>
    <p>{t("Music providers may return a preview. A live room must be broadcasting, and each viewer must be able to reach its media source.")}</p>
    <h2>{t("Can I create a room with a video already selected?")}</h2>
    <p>{withElement(t("Link to {url}, replacing URL_HERE with a URL-encoded media link."), "url", <code>{window.location.origin}/create?video=URL_HERE</code>)}</p>
    <h2>{t("Why is screen sharing missing audio?")}</h2>
    <p>{t("Select a sharing source that supports audio and enable its audio option. Available sources depend on your browser and operating system.")}</p>
    <h2>{t("What is a virtual browser?")}</h2>
    <p>{t("A virtual browser runs on a shared remote machine. It requires a separately configured service; availability and session limits depend on this deployment.")}</p>
  </div>
);
