import React from "react";
import { Modal, Loader, Menu, Text } from "@mantine/core";
import { IconFile } from "@tabler/icons-react";
import { t } from "../../i18n";

export const MultiStreamModal = ({
  streams,
  setMedia,
  resetMultiSelect,
}: {
  streams: { name: string; url: string; length: number; playFn?: () => void }[];
  setMedia: (value: string) => void;
  resetMultiSelect: () => void;
}) => {
  return (
    <Modal
      opened
      onClose={resetMultiSelect}
      centered
      title={t("Select a file")}
    >
      {streams.length === 0 ? (
        <Loader />
      ) : (
        <Menu>
          {streams.map((file) => (
            <Menu.Item
              leftSection={<IconFile />}
              onClick={() => {
                setMedia(file.url);
                resetMultiSelect();
              }}
            >
              {file.name}
              <Text size="sm">
                {t("{count} bytes", { count: file.length.toLocaleString() })}
              </Text>
            </Menu.Item>
          ))}
        </Menu>
      )}
    </Modal>
  );
};
