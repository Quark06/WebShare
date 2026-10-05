import React from "react";
import { Modal, Title, Table, Button } from "@mantine/core";
import { SignInButton } from "../TopBar/TopBar";
import config from "../../config";
import { MetadataContext } from "../../MetadataContext";
import { IconBrandStripeFilled, IconCheck } from "@tabler/icons-react";
import { serverPath } from "../../utils/utils";
import { t } from "../../i18n";

export class SubscribeModal extends React.Component<{
  closeSubscribe: () => void;
}> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  onSubscribe = async () => {
    try {
      const user = this.context.user;
      const resp = await fetch(`${serverPath}/checkoutSub`, {
        credentials: "include",
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user?.uid,
          email: user?.email,
          return_url: window.location.href,
        }),
      });
      const json = await resp.json();
      if (json?.url) {
        // Go to the checkout page
        window.location.href = json.url;
      } else {
        throw Error();
      }
    } catch (e) {
      console.error(e);
    }
  };
  render() {
    const { closeSubscribe } = this.props;
    return (
      <Modal
        opened
        onClose={closeSubscribe}
        centered
        size="auto"
        title={t("Subscribe to WebShare Plus")}
      >
        <div>
          {t(
            "Subscriptions help us maintain the service and build new features! Please consider supporting us if you're enjoying WebShare.",
          )}
        </div>
        <Title order={6}>{t("Features")}</Title>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th />
              <Table.Th>{t("WebShare Free")}</Table.Th>
              <Table.Th>WebShare Plus</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {/* Priority support */}
            <Table.Tr>
              <Table.Td>
                {t("Synchronized watching, chat, screenshare")}
              </Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("Number of Permanent Rooms")}</Table.Td>
              <Table.Td>{t("Server configured")}</Table.Td>
              <Table.Td>{t("Server configured")}</Table.Td>
            </Table.Tr>
            {/* <Table.Tr>
                  <Table.Td>Max Room Capacity</Table.Td>
                  <Table.Td>20</Table.Td>
                  <Table.Td>100</Table.Td>
                </Table.Tr> */}
            <Table.Tr>
              <Table.Td>{t("VBrowser Access")}</Table.Td>
              <Table.Td>{t("When capacity allows")}</Table.Td>
              <Table.Td>{t("Anytime")}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("VBrowser Max Resolution")}</Table.Td>
              <Table.Td>720p</Table.Td>
              <Table.Td>1080p</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("VBrowser CPU/RAM")}</Table.Td>
              <Table.Td>{t("Standard")}</Table.Td>
              <Table.Td>{t("Extra")}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("VBrowser Session Length")}</Table.Td>
              <Table.Td>{t("Server configured")}</Table.Td>
              <Table.Td>{t("Server configured")}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("VBrowser Region Selection")}</Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>
                {t("Share your screen/file to more viewers with Relay")}
              </Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("Custom room URLs and titles")}</Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>
                {t("Discord subscriber role (with linked account)")}
              </Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("Colored names in chat")}</Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>
                <IconCheck />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("Price")}</Table.Td>
              <Table.Td>{t("$0 / month")}</Table.Td>
              <Table.Td>{t("See checkout")}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        <div style={{ textAlign: "right" }}>
          {/* if user isn't logged in, provide login prompt */}
          {this.context.user && this.context.user.email ? (
            <Button
              leftSection={<IconBrandStripeFilled />}
              onClick={this.onSubscribe}
            >
              {t("Subscribe with Stripe")}
            </Button>
          ) : (
            <div>
              {t("Please sign in to subscribe:")} <SignInButton />
            </div>
          )}
        </div>
      </Modal>
    );
  }
}
