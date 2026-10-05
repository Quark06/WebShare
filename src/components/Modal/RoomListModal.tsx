import { useEffect, useState } from "react";
import { Alert, Badge, Loader, Modal, Text } from "@mantine/core";
import { IconLock, IconUsers } from "@tabler/icons-react";
import ChatVideoCard from "../ChatVideoCard/ChatVideoCard";
import {
  getFileName,
  isBilibili,
  isFileShare,
  isMagnet,
  isScreenShare,
  isVBrowser,
  isYouTube,
  serverPath,
} from "../../utils/utils";
import { isMusic } from "../../utils/music";
import styles from "./RoomListModal.module.css";
import { msg, t } from "../../i18n";

// Rooms only know the title of media chosen from search or the playlist; label the rest by its link
function mediaCard(room: RoomListItem): PlaylistVideo | undefined {
  const url = room.video;
  if (room.media) return room.media;
  if (!url) return;
  const share = isScreenShare(url)
    ? t("Screen share")
    : isFileShare(url)
      ? t("Shared file")
      : isVBrowser(url)
        ? t("Virtual browser")
        : "";
  if (share) return { url, name: share, channel: "", duration: 0, type: "share" };
  const type = isYouTube(url)
    ? "youtube"
    : isBilibili(url)
      ? "bilibili"
      : isMusic(url)
        ? "music"
        : isMagnet(url)
          ? "magnet"
          : "file";
  const name = type === "file" ? getFileName(url) || url : url;
  return { url, name, channel: t("Video URL"), duration: 0, type };
}

function lastActive(room: RoomListItem) {
  if (room.users) return t("Active now");
  const minutes = Math.floor((Date.now() - Date.parse(room.lastActive)) / 60000);
  if (minutes < 1) return t("Active just now");
  if (minutes < 60) return t("Active {minutes} min ago", { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("Active {hours} h ago", { hours });
  return t("Active {days} d ago", { days: Math.floor(hours / 24) });
}

export const RoomListModal = ({
  onClose,
  openNewTab,
}: {
  onClose: () => void;
  openNewTab?: boolean;
}) => {
  const [rooms, setRooms] = useState<RoomListItem[] | undefined>();
  const [archiveHours, setArchiveHours] = useState(72);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(serverPath + "/rooms");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setRooms(data.rooms);
        setArchiveHours(data.archiveHours);
      } catch (e) {
        setError(
          e instanceof Error && e.message
            ? e.message
            : msg("Couldn't load rooms."),
        );
      }
    }
    load();
  }, []);

  return (
    <Modal opened centered size="lg" onClose={onClose} title={t("Join a room")}>
      {error && (
        <Alert color="red" variant="light">
          {t(error)}
        </Alert>
      )}
      {!error && !rooms && (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
          <Loader />
        </div>
      )}
      {rooms?.length === 0 && (
        <Text c="dimmed">
          {t("No open rooms yet. Create one with New Room.")}
        </Text>
      )}
      {Boolean(rooms?.length) && (
        <div className={styles.List}>
          {rooms?.map((room) => {
            const media = mediaCard(room);
            return (
              <a
                key={room.roomId}
                className={styles.Room}
                href={room.vanity ? "/r/" + room.vanity : "/watch" + room.roomId}
                target={openNewTab ? "_blank" : undefined}
              >
                <div className={styles.Header}>
                  {room.locked && <IconLock size={16} title={t("Password")} />}
                  <div
                    className={styles.Name}
                    style={{ color: room.titleColor || undefined }}
                  >
                    {room.title || room.roomId.slice(1)}
                  </div>
                  <div className={styles.Meta}>
                    <Text size="xs" c="dimmed">
                      {lastActive(room)}
                    </Text>
                    <Badge
                      color={room.users ? "green" : "gray"}
                      leftSection={<IconUsers size={12} />}
                    >
                      {room.users}
                    </Badge>
                  </div>
                </div>
                {room.description && (
                  <Text size="sm" c="dimmed">
                    {room.description}
                  </Text>
                )}
                {media ? (
                  <ChatVideoCard video={media} index={0} />
                ) : (
                  <Text size="sm" c="dimmed">
                    {t("Nothing playing")}
                  </Text>
                )}
              </a>
            );
          })}
        </div>
      )}
      <Text size="xs" c="dimmed" style={{ marginTop: 16 }}>
        {t(
          "Rooms with no visitors for {hours} hours are archived and leave this list.",
          { hours: archiveHours },
        )}
      </Text>
    </Modal>
  );
};
