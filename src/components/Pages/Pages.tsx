import React from "react";

const pageStyle: React.CSSProperties = {
  maxWidth: "100%", width: "800px", padding: "20px", margin: "0 auto",
};

export const Privacy = () => (
  <div style={pageStyle}>
    <h1>Privacy and data</h1>
    <p>WebShare can be used without an account. If this site enables login, its configured authentication provider handles your account.</p>
    <p>Your browser stores settings, a client identifier, your display name and saved room passwords. Room participants can see your name, messages and shared media links.</p>
    <p>The server processes room state and messages. A deployment with a database can save room data between restarts. The operator controls server logs and data retention.</p>
    <p>Video, live stream and music searches send requests to their respective platforms. Direct playback connects your browser to the media provider. Providers such as YouTube, Bilibili, music platforms and avatar services have their own privacy practices.</p>
    <p>Camera, screen and file sharing connect room participants through WebRTC. A configured relay service may carry shared media.</p>
    <p>Contact the operator of this site for account or data requests. WebShare does not include a default analytics service.</p>
  </div>
);

export const Terms = () => (
  <div style={pageStyle}>
    <h1>Using WebShare</h1>
    <p>Share media and files you are allowed to share, and respect other room participants.</p>
    <p>Media platforms control content availability and playback permissions. YouTube usage is subject to the <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>.</p>
    <p>Room links can be shared with other people. Use available room controls to manage access.</p>
    <p>Available features depend on this site's configuration. Contact its operator for service or billing questions; any subscription price is shown at checkout.</p>
  </div>
);

export const FAQ = () => (
  <div style={pageStyle}>
    <h1>FAQ</h1>
    <h2>How do I watch with friends?</h2>
    <p>Create a room and share its link. Search for media or paste a supported video, music or Bilibili live room link.</p>
    <h2>Does media pass through WebShare?</h2>
    <p>Bilibili video, live and music playback connect directly to the platform. WebShare handles searches, link resolution, chat and room synchronization. Screen sharing, local file sharing and virtual browsers use their own connections.</p>
    <h2>Why does a song stop early or a live room fail?</h2>
    <p>Music providers may return a preview. A live room must be broadcasting, and each viewer must be able to reach its media source.</p>
    <h2>Can I create a room with a video already selected?</h2>
    <p>Link to <code>{window.location.origin}/create?video=URL_HERE</code>, replacing URL_HERE with a URL-encoded media link.</p>
    <h2>Why is screen sharing missing audio?</h2>
    <p>Select a sharing source that supports audio and enable its audio option. Available sources depend on your browser and operating system.</p>
    <h2>What is a virtual browser?</h2>
    <p>A virtual browser runs on a shared remote machine. It requires a separately configured service; availability and session limits depend on this deployment.</p>
  </div>
);
