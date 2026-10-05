import React from "react";
import { Link } from "react-router-dom";
import { softWhite } from "../../utils/utils";
import { t } from "../../i18n";

export const Footer = () => (
  <div
    style={{
      margin: "1em",
      paddingBottom: "1em",
      fontSize: "14px",
      color: softWhite,
    }}
  >
    <Link to="/terms">{t("Usage")}</Link>
    {" · "}
    <Link to="/privacy">{t("Privacy")}</Link>
    {" · "}
    <Link to="/faq">{t("FAQ")}</Link>
  </div>
);
