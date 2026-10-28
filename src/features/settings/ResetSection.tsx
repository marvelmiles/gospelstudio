import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Button } from "../../components/ui/Button";
import { InfoTip } from "../../components/ui/InfoTip";
import { SectionTitle, TextInput } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { MAX_KEPT_ITEMS } from "../../lib/keepOnReset";
import { APP_NAME } from "../../lib/appInfo";

const RESET_PHRASE = "ResetApp";

export const ResetSection = ({
  keptItems,
  onBeforeReset,
}: {
  keptItems: string[];
  onBeforeReset: () => void;
}) => {
  const resetApp = useStore((s) => s.resetApp);
  const [isConfirming, setIsConfirming] = useState(false);
  const [typedPhrase, setTypedPhrase] = useState("");

  return (
    <>
      <SectionTitle
        info={
          <InfoTip title="Reset">
            Restore {APP_NAME} to its original state, exactly like the first
            time you opened it.{" "}
            {keptItems.length > 0
              ? `${keptItems.length} of ${MAX_KEPT_ITEMS} "keep on reset" slots are in use, and those items will survive.`
              : `Manuscripts and custom themes you mark "Keep on reset" (up to ${MAX_KEPT_ITEMS}) survive this.`}
          </InfoTip>
        }
      >
        Reset
      </SectionTitle>
      <Button
        variant="danger"
        onClick={() => {
          setTypedPhrase("");
          setIsConfirming(true);
        }}
      >
        <RotateCcw size={15} />
        Reset App to Defaults
      </Button>

      {isConfirming && (
        <Modal
          open
          onClose={() => setIsConfirming(false)}
          title="Reset everything?"
          width={480}
          footer={
            <>
              <Button onClick={() => setIsConfirming(false)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={typedPhrase.trim() !== RESET_PHRASE}
                onClick={async () => {
                  setIsConfirming(false);
                  onBeforeReset();
                  await resetApp();
                }}
              >
                Reset everything
              </Button>
            </>
          }
        >
          <div className="mb-4 flex gap-3 rounded-[11px] border border-danger/30 bg-danger/10 p-3.5">
            <AlertTriangle size={20} className="mt-px shrink-0 text-danger" />
            <div className="text-[13.5px] leading-[1.6] text-fg">
              This permanently deletes{" "}
              <strong>
                all your manuscripts, custom themes, backgrounds, audio, and
                settings
              </strong>
              , and restores the built-in defaults. You&apos;ll be treated as a
              first-time user again. This can&apos;t be undone, so export a
              backup first if you want to keep anything.
              {keptItems.length > 0 && (
                <>
                  {" "}
                  The {keptItems.length} item
                  {keptItems.length === 1 ? "" : "s"} you marked{" "}
                  <strong>Keep on reset</strong> will survive:{" "}
                  {keptItems.join(", ")}.
                </>
              )}
            </div>
          </div>
          <p className="mt-0 mb-2 text-[13.5px] leading-[1.6] text-sub">
            Type <code className="text-fg normal-case">{RESET_PHRASE}</code>{" "}
            below to confirm (case-sensitive).
          </p>
          <TextInput
            value={typedPhrase}
            placeholder={RESET_PHRASE}
            onChange={(event) => setTypedPhrase(event.target.value)}
          />
        </Modal>
      )}
    </>
  );
};
