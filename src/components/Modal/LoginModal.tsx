import React from "react";
import {
  Modal,
  Button,
  Alert,
  TextInput,
  PasswordInput,
  Divider,
} from "@mantine/core";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import {
  IconBrandFacebookFilled,
  IconBrandGoogleFilled,
} from "@tabler/icons-react";
import config from "../../config";
import { t } from "../../i18n";

export class LoginModal extends React.Component<{
  closeModal: () => void;
}> {
  public state = {
    email: "",
    password: "",
    showCreate: false,
    showReset: false,
    error: "",
  };

  emailSignIn = async (email: string, password: string) => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);

      this.props.closeModal();
    } catch (e: any) {
      // handle exceptions
      this.setState({ error: e.message });
    }
  };

  // emailLinkSignIn = async () => {
  //   await firebase.auth().sendSignInLinkToEmail(this.state.email, {
  //     url: window.location.href,
  //     handleCodeInApp: true,
  //   });
  // };

  facebookSignIn = async () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  };

  googleSignIn = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  };

  render() {
    const { closeModal } = this.props;
    const enabledOptions = config.VITE_FIREBASE_SIGNIN_METHODS.split(",");
    return (
      <>
        {this.state.showCreate && (
          <CreateModal
            closeModal={() => this.setState({ showCreate: false })}
          />
        )}
        {this.state.showReset && (
          <ResetModal closeModal={() => this.setState({ showReset: false })} />
        )}
        <Modal
          opened
          onClose={closeModal}
          title={t("Login")}
          size="auto"
          centered
        >
          <div>
            <div style={{ display: "flex", gap: "4px" }}>
              {enabledOptions.includes("facebook") && (
                <Button
                  leftSection={<IconBrandFacebookFilled />}
                  onClick={this.facebookSignIn}
                >
                  Facebook
                </Button>
              )}
              {enabledOptions.includes("google") && (
                <Button
                  leftSection={<IconBrandGoogleFilled />}
                  onClick={this.googleSignIn}
                >
                  Google
                </Button>
              )}
            </div>
            {enabledOptions.includes("email") && (
              <>
                <Divider
                  label={t("Or sign in with email")}
                  labelPosition="center"
                  my="lg"
                />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    this.emailSignIn(this.state.email, this.state.password);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {this.state.error && (
                    <Alert color="red" title={t("Error")}>
                      {t(this.state.error)}
                    </Alert>
                  )}
                  <TextInput
                    label={t("Email")}
                    placeholder={t("Email")}
                    value={this.state.email}
                    onChange={(e) => this.setState({ email: e.target.value })}
                  />
                  <PasswordInput
                    label={t("Password")}
                    placeholder={t("Password")}
                    value={this.state.password}
                    onChange={(e) =>
                      this.setState({ password: e.target.value })
                    }
                  />
                  <Button type="submit">{t("Login")}</Button>
                </form>
                <Divider label={t("Or")} labelPosition="center" my="lg" />
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    size="xs"
                    onClick={() => this.setState({ showCreate: true })}
                  >
                    {t("Create account")}
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => this.setState({ showReset: true })}
                  >
                    {t("Reset password")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </>
    );
  }
}

export class CreateModal extends React.Component<{
  closeModal: () => void;
}> {
  public state = { email: "", password: "", error: "" };

  createAccount = async (email: string, password: string) => {
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
    } catch (e: any) {
      // handle exceptions
      this.setState({ error: e.message });
    }
  };

  render() {
    const { closeModal } = this.props;
    return (
      <Modal
        opened
        onClose={closeModal}
        title={t("Create an account")}
        size="auto"
        centered
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            this.createAccount(this.state.email, this.state.password);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {this.state.error && (
            <Alert color="red" title={t("Error")}>
              {t(this.state.error)}
            </Alert>
          )}
          <TextInput
            label={t("Email")}
            placeholder={t("Email")}
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value })}
          />
          <PasswordInput
            label={t("Password")}
            placeholder={t("Password")}
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value })}
          />
          <Button type="submit">{t("Create")}</Button>
        </form>
      </Modal>
    );
  }
}

export class ResetModal extends React.Component<{
  closeModal: () => void;
}> {
  public state = { email: "", password: "", error: "" };

  resetPassword = async () => {
    try {
      await firebase.auth().sendPasswordResetEmail(this.state.email);
      this.props.closeModal();
    } catch (e: any) {
      // handle exceptions
      this.setState({ error: e.message });
    }
  };

  render() {
    const { closeModal } = this.props;
    return (
      <Modal opened onClose={closeModal} title={t("Reset password")} centered>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            this.resetPassword();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {this.state.error && (
            <Alert color="red" title={t("Error")}>
              {t(this.state.error)}
            </Alert>
          )}
          <TextInput
            label={t("Email")}
            placeholder={t("Email")}
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value })}
          />
          <Button type="submit">{t("Reset")}</Button>
        </form>
      </Modal>
    );
  }
}
