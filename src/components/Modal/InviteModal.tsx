import React, { useState } from "react";
import { Modal, TextInput, ActionIcon } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";
import { t } from "../../i18n";

export const InviteModal = ({
  closeInviteModal,
}: {
  closeInviteModal: () => void;
}) => {
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setInviteLinkCopied(true);
  };

  return (
    <Modal
      opened
      centered
      onClose={closeInviteModal}
      title={t("Invite friends and watch together!")}
    >
      <TextInput
        label={t("Copy and share this link:")}
        readOnly
        rightSection={
          <ActionIcon onClick={handleCopyInviteLink} color="teal">
            <IconCopy size={16} />
          </ActionIcon>
        }
        defaultValue={window.location.href}
      />
      {inviteLinkCopied && (
        <div style={{ marginTop: 15 }}>
          <b style={{ color: "green" }}>{t("Link copied to clipboard.")}</b>
        </div>
      )}
    </Modal>
  );
};
