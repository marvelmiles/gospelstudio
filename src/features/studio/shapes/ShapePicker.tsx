import { Modal } from "@/components/shared/Modal";
import type { ShapeKind } from "../types/layer";
import { ShapeGrid } from "./ShapeGrid";

interface ShapePickerProps {
  open: boolean;
  onChoose: (shape: ShapeKind) => void;
  onClose: () => void;
}

export const ShapePicker = ({ open, onChoose, onClose }: ShapePickerProps) => (
  <Modal open={open} onClose={onClose} title="Choose a shape" width={420}>
    <ShapeGrid onChoose={onChoose} />
  </Modal>
);
