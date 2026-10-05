import React from "react";
import { Modal, Button, Table } from "@mantine/core";
import { t } from "../../i18n";

export const FileShareModal = (props: {
  closeModal: () => void;
  startFileShare: () => void;
}) => {
  const { closeModal } = props;
  return (
    <Modal
      opened
      onClose={closeModal}
      title={t("Share a file")}
      size="auto"
      centered
    >
      <div>{t("You're about to share a file from your device.")}</div>
      <Table striped>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>{t("Method")}</Table.Td>
            <Table.Td>
              {t(
                "Stream your video to each viewer from your device. May not work with codecs not playable in browsers.",
              )}
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Latency")}</Table.Td>
            <Table.Td>{`<1s`}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Recommended Max Viewers")}</Table.Td>
            <Table.Td>5</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Recommended Upload Speed")}</Table.Td>
            <Table.Td>{t("5 Mbps per viewer")}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td></Table.Td>
            <Table.Td>
              <Button
                onClick={() => {
                  props.startFileShare();
                  props.closeModal();
                }}
              >
                {t("Start Fileshare")}
              </Button>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Modal>
  );
};
