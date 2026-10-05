import React, { useContext } from "react";
import { Modal, Button, Table } from "@mantine/core";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import { MetadataContext } from "../../MetadataContext";
import { t } from "../../i18n";

export const FileShareModal = (props: {
  closeModal: () => void;
  startFileShare: (useMediaSoup: boolean) => void;
  startConvert: () => void;
}) => {
  const context = useContext(MetadataContext);
  const { closeModal } = props;
  const subscribeButton = <SubscribeButton />;
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
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>{t("WebShare Free")}</Table.Th>
            <Table.Th>{t("WebShare Plus (Relay)")}</Table.Th>
            <Table.Th>{t("WebShare Plus (Convert)")}</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td>{t("Method")}</Table.Td>
            <Table.Td>
              {t(
                "Stream your video to each viewer from your device. May not work with codecs not playable in browsers.",
              )}
            </Table.Td>
            <Table.Td>
              {t(
                "Stream your video to our relay server, which sends it to each viewer, reducing bandwidth usage. May not work with codecs not playable in browsers.",
              )}
            </Table.Td>
            <Table.Td>
              {t(
                "We convert your video in real-time to a web-compatible format and serve the result. Avoids codec compatibility issues and allows more viewers.",
              )}
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Latency")}</Table.Td>
            <Table.Td>{`<1s`}</Table.Td>
            <Table.Td>{`<1s`}</Table.Td>
            <Table.Td>{`~5s`}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Recommended Max Viewers")}</Table.Td>
            <Table.Td>5</Table.Td>
            <Table.Td>20</Table.Td>
            <Table.Td>100</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Recommended Upload Speed")}</Table.Td>
            <Table.Td>{t("5 Mbps per viewer")}</Table.Td>
            <Table.Td>5 Mbps</Table.Td>
            <Table.Td>5 Mbps</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td></Table.Td>
            <Table.Td>
              <Button
                onClick={() => {
                  props.startFileShare(false);
                  props.closeModal();
                }}
              >
                {t("Start Fileshare")}
              </Button>
            </Table.Td>
            <Table.Td>
              {context.isSubscriber ? (
                <Button
                  color="orange"
                  onClick={() => {
                    props.startFileShare(true);
                    props.closeModal();
                  }}
                >
                  {t("Start Fileshare w/Relay")}
                </Button>
              ) : (
                subscribeButton
              )}
            </Table.Td>
            <Table.Td>
              {context.isSubscriber ? (
                <Button
                  color="orange"
                  onClick={() => {
                    props.startConvert();
                    props.closeModal();
                  }}
                >
                  {t("Start Fileshare w/Convert")}
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
