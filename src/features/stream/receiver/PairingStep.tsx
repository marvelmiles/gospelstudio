import type { ReactNode } from "react";
import { Panel } from "../../../components/ui/Panel";

interface PairingStepProps {
  stepNumber: number;
  title: string;
  children: ReactNode;
}

export const PairingStep = ({
  stepNumber,
  title,
  children,
}: PairingStepProps) => {
  return (
    <Panel>
      <div className="mb-3.5 flex items-center gap-2.25">
        <span className="grid size-6 place-items-center rounded-full bg-accent text-[12.5px] font-extrabold text-on-accent">
          {stepNumber}
        </span>
        <span className="text-base font-semibold text-fg">{title}</span>
      </div>
      {children}
    </Panel>
  );
};
