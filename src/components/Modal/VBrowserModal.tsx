import React from "react";
import { Modal, Button, Table, Alert, Select, Avatar } from "@mantine/core";
import { SignInButton } from "../TopBar/TopBar";
import { serverPath } from "../../utils/utils";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import config from "../../config";
import { MetadataContext } from "../../MetadataContext";
import { IconHourglass } from "@tabler/icons-react";
import { t } from "../../i18n";

export class VBrowserModal extends React.Component<{
  closeModal: () => void;
  startVBrowser: (options: { size: string; region: string }) => void;
}> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  state = {
    isFreePoolFull: false,
    region: "any",
  };

  async componentDidMount() {
    const resp = await fetch(serverPath + "/metadata");
    const metadata = await resp.json();
    this.setState({ isFreePoolFull: metadata.isFreePoolFull });
  }
  render() {
    const regionOptions = [
      {
        label: t("Any available"),
        value: "any",
        image: { avatar: false, src: "" },
      },
      {
        label: t("US East"),
        value: "US",
        image: { avatar: false, src: "/flag-united-states.png" },
      },
      {
        label: t("US West"),
        value: "USW",
        image: { avatar: false, src: "/flag-united-states.png" },
      },
      {
        label: t("Europe"),
        value: "EU",
        image: { avatar: false, src: "/flag-european-union.png" },
      },
    ];
    const { closeModal, startVBrowser } = this.props;
    const LaunchButton = ({ large }: { large: boolean }) => {
      return (
        <Button
          color={large ? "orange" : undefined}
          onClick={async () => {
            startVBrowser({
              size: large ? "large" : "",
              region: this.state.region === "any" ? "" : this.state.region,
            });
            closeModal();
          }}
        >
          {large ? t("Launch VBrowser+") : t("Continue with Free")}
        </Button>
      );
    };
    const vmPoolFullMessage = (
      <Alert
        style={{ maxWidth: "300px" }}
        color="red"
        icon={<IconHourglass />}
        title={t("No Free VBrowsers Available")}
      >
        <div>
          <div>{t("All of the free VBrowsers are currently being used.")}</div>
          <div>
            {t(
              "Please consider subscribing for anytime access to faster VBrowsers, or try again later.",
            )}
          </div>
        </div>
      </Alert>
    );

    const subscribeButton = <SubscribeButton />;

    const canLaunch = this.context.user || !config.VITE_FIREBASE_CONFIG;
    return (
      <Modal
        opened
        onClose={closeModal}
        title={t("Launch a VBrowser")}
        centered
        size="auto"
      >
        <div>
          {t("You're about to launch a virtual browser to share in this room.")}
        </div>
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
              <Table.Td>{t("{count} hours", { count: 3 })}</Table.Td>
              <Table.Td>{t("{count} hours", { count: 24 })}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("Recommended Max Viewers")}</Table.Td>
              <Table.Td>15</Table.Td>
              <Table.Td>30</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("Region")}</Table.Td>
              <Table.Td>{t("Where available")}</Table.Td>
              <Table.Td>
                <Select
                  onChange={(value, option) => this.setState({ region: value })}
                  value={this.state.region}
                  data={regionOptions}
                  renderOption={({ option }: { option: any }) => (
                    <div
                      key={option.value}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <Avatar radius="xs" src={option.image.src} />
                      {option.label}
                    </div>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td></Table.Td>
              <Table.Td>
                {canLaunch ? (
                  this.state.isFreePoolFull ? (
                    vmPoolFullMessage
                  ) : (
                    <LaunchButton large={false} />
                  )
                ) : (
                  <SignInButton />
                )}
              </Table.Td>
              <Table.Td>
                {this.context.isSubscriber ? (
                  <LaunchButton large />
                ) : (
                  subscribeButton
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Modal>
    );
  }
}
