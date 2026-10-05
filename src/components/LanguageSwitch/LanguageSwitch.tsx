import { useEffect, useState } from "react";
import { ActionIcon, Menu } from "@mantine/core";
import { IconCheck, IconLanguage } from "@tabler/icons-react";
import {
  getLanguage,
  languageNames,
  onLanguageChange,
  setLanguage,
  t,
  type Language,
} from "../../i18n";

export const LanguageSwitch = () => {
  const [language, setCurrent] = useState(getLanguage());
  useEffect(() => onLanguageChange(() => setCurrent(getLanguage())), []);
  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon color="gray" size="lg" title={t("Language")}>
          <IconLanguage />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {(Object.keys(languageNames) as Language[]).map((value) => (
          <Menu.Item
            key={value}
            onClick={() => setLanguage(value)}
            rightSection={value === language ? <IconCheck size={16} /> : null}
          >
            {languageNames[value]}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
