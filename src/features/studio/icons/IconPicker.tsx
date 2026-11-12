import { Modal } from "@/components/shared/Modal";
import type { IconName } from "../lib/iconCatalog";
import { IconGrid } from "./IconGrid";

interface IconPickerProps {
  open: boolean;
  value?: IconName;
  onChoose: (icon: IconName) => void;
  onClose: () => void;
}

export const IconPicker = ({
  open,
  value,
  onChoose,
  onClose,
}: IconPickerProps) => (
  <Modal open={open} onClose={onClose} title="Choose an icon" width={520}>
    <IconGrid value={value} onChoose={onChoose} />
  </Modal>
);
