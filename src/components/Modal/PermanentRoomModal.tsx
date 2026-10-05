import React from "react";
import { Modal, Table } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { t } from "../../i18n";

export const PermanentRoomModal = (props: { closeModal: () => void }) => {
  const { closeModal } = props;
  return (
    <Modal opened onClose={closeModal} title={t("Permanent Rooms")}>
      <div>
        {t("Registered users have the ability to make their rooms permanent.")}
      </div>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>{t("Temporary")}</Table.Th>
            <Table.Th>{t("Permanent")}</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td>{t("Expiry")}</Table.Td>
            <Table.Td>{t("After 24 hours of inactivity")}</Table.Td>
            <Table.Td>{t("Never")}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Room Passwords")}</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Disable Chat")}</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Kick Users")}</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>{t("Custom Room URLs")}</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Modal>
  );
};
