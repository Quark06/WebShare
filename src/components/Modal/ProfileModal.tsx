import React from "react";
import { Modal, Button, Avatar } from "@mantine/core";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { serverPath } from "../../utils/utils";
import { MetadataContext } from "../../MetadataContext";
import { t } from "../../i18n";
import {
  IconBrandGravatar,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconKeyFilled,
  IconLogout,
  IconTrashFilled,
} from "@tabler/icons-react";

export class ProfileModal extends React.Component<{
  close: () => void;
  userImage: string | null;
}> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  public state = {
    resetDisabled: false,
    verifyDisabled: false,
    deleteConfirmOpen: false,
  };

  onSignOut = () => {
    firebase.auth().signOut();
    window.localStorage.removeItem("webshare-loginname");
    window.location.reload();
  };

  resetPassword = async () => {
    try {
      if (this.context.user?.email) {
        await firebase.auth().sendPasswordResetEmail(this.context.user.email);
        this.setState({ resetDisabled: true });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  verifyEmail = async () => {
    try {
      if (this.context.user) {
        await this.context.user.sendEmailVerification();
        this.setState({ verifyDisabled: true });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  deleteAccountConfirm = () => {
    this.setState({ deleteConfirmOpen: true });
  };

  deleteAccount = async () => {
    const token = await this.context.user?.getIdToken();
    await fetch(serverPath + "/deleteAccount", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid: this.context.user?.uid, token }),
    });
    window.location.reload();
  };

  render() {
    const { close, userImage } = this.props;
    return (
      <Modal opened onClose={close} centered>
        <Modal
          opened={this.state.deleteConfirmOpen}
          onClose={() => {
            this.setState({ deleteConfirmOpen: false });
          }}
          title={t("Delete Your Account")}
        >
          <p>
            {t(
              "Are you sure you want to delete your account? This can't be undone.",
            )}
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            <Button
              onClick={async () => {
                await this.deleteAccount();
              }}
            >
              {t("Yes")}
            </Button>
            <Button
              onClick={() => {
                this.setState({ deleteConfirmOpen: false });
              }}
            >
              {t("No")}
            </Button>
          </div>
        </Modal>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Avatar src={userImage} />
          {this.context.user?.email}
          {this.context.user?.emailVerified && (
            <IconCircleCheckFilled
              title={t("This email is verified")}
              color="green"
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            margin: "10px",
          }}
        >
          <Button
            component="a"
            leftSection={<IconBrandGravatar />}
            href="https://gravatar.com"
            target="_blank"
            color="blue"
          >
            {t("Edit Gravatar")}
          </Button>
          <Button
            disabled={
              this.context.user?.emailVerified || this.state.verifyDisabled
            }
            leftSection={<IconCircleCheck />}
            color="purple"
            onClick={this.verifyEmail}
          >
            {t("Verify Email")}
          </Button>
          <Button
            disabled={this.state.resetDisabled}
            leftSection={<IconKeyFilled />}
            color="green"
            onClick={this.resetPassword}
          >
            {t("Reset Password")}
          </Button>
          <Button
            leftSection={<IconTrashFilled />}
            color="red"
            onClick={this.deleteAccountConfirm}
          >
            {t("Delete Account")}
          </Button>
          <Button leftSection={<IconLogout />} onClick={this.onSignOut}>
            {t("Sign out")}
          </Button>
        </div>
      </Modal>
    );
  }
}
