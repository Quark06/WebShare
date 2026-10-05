import React, { useContext } from "react";
import { Modal, Button, Table } from "@mantine/core";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import { MetadataContext } from "../../MetadataContext";
import { t } from "../../i18n";

export const ScreenShareModal = ({
  closeModal,
  startScreenShare,
}: {
  closeModal: () => void;
  startScreenShare: (useMediaSoup: boolean) => void;
}) => {
  const { isSubscriber } = useContext(MetadataContext);
  const subscribeButton = <SubscribeButton />;
  return (
    <Modal
      opened={true}
      onClose={closeModal}
      title={t("Share your screen")}
      centered
      size="auto"
    >
      <div>{t("You're about to share your screen.")}</div>
      <ul>
        <li>
          {t("This feature is only supported on Chrome and Edge on desktop.")}
        </li>
        <li>
          {t(
            "Audio sharing only works if sharing your entire screen or a browser tab, not an application.",
          )}
        </li>
      </ul>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>{t("WebShare Free")}</Table.Th>
            <Table.Th>WebShare Plus</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td>{t("Method")}</Table.Td>
            <Table.Td>
              {t("Stream your video to each viewer from your device.")}
            </Table.Td>
            <Table.Td>
              {t(
                "Stream your video to our relay server, which sends it to each viewer, reducing bandwidth usage.",
              )}
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Latency")}</Table.Td>
            <Table.Td>{`<1s`}</Table.Td>
            <Table.Td>{`<1s`}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Recommended Max Viewers")}</Table.Td>
            <Table.Td>5</Table.Td>
            <Table.Td>20</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Recommended Upload Speed")}</Table.Td>
            <Table.Td>{t("5 Mbps per viewer")}</Table.Td>
            <Table.Td>5 Mbps</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td></Table.Td>
            <Table.Td>
              <Button
                onClick={() => {
                  startScreenShare(false);
                  closeModal();
                }}
              >
                {t("Start Screenshare")}
              </Button>
            </Table.Td>
            <Table.Td>
              {isSubscriber ? (
                <Button
                  color="orange"
                  onClick={() => {
                    startScreenShare(true);
                    closeModal();
                  }}
                >
                  {t("Start Screenshare w/Relay")}
                </Button>
              ) : (
                subscribeButton
              )}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Modal>
  );
};
