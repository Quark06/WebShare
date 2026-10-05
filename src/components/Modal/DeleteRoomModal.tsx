import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { t } from "../../i18n";

export const DeleteRoomModal = ({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) => {
  return (
    <Modal opened centered onClose={onClose} title={t("Delete this room?")}>
      <Text size="sm">
        {t(
          "Everyone in the room will be disconnected, and its playlist, chat and playback progress will be deleted. This can't be undone.",
        )}
      </Text>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
        }}
      >
        <Button variant="default" onClick={onClose}>
          {t("Cancel")}
        </Button>
        <Button color="red" leftSection={<IconTrash />} onClick={onConfirm}>
          {t("Delete Room")}
        </Button>
      </div>
    </Modal>
  );
};
