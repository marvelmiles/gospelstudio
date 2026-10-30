import { useValueChange } from "@/hooks/useValueChange";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Film, Music } from "lucide-react";
import { useStore, type UploadKind } from "../../store/useStore";
import { cn } from "../../lib/utils";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { InfoTip } from "./InfoTip";

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "");

const KIND_NOUNS: Record<UploadKind, { one: string; many: string }> = {
  audio: { one: "sound", many: "sounds" },
  image: { one: "image", many: "images" },
  video: { one: "video", many: "videos" },
};

const visualKinds: UploadKind[] = ["image"];

type RowStatus = "saved" | "saving" | "waiting" | "naming";

const StatusBadge = ({ status }: { status: RowStatus }) => {
  if (status === "naming") return null;
  return (
    <div
      className={cn(
        "grid size-6.5 shrink-0 place-items-center rounded-lg",
        status === "saved" && "bg-primary/18 text-primary",
        status === "waiting" && "text-subtle-foreground",
      )}
    >
      {status === "saved" && <Check size={15} />}
      {status === "saving" && <Spinner size={16} />}
      {status === "waiting" && <Clock size={15} />}
    </div>
  );
};

export const UploadLabelModal = () => {
  const pending = useStore((s) => s.pendingUpload);
  const commit = useStore((s) => s.commitUpload);
  const cancel = useStore((s) => s.cancelUpload);

  const [labels, setLabels] = useState<string[]>([]);

  useValueChange(
    pending,
    (next) => {
      if (next && next.savingIndex === null)
        setLabels(next.files.map((file) => stripExtension(file.name)));
    },
    { onMount: true },
  );

  const showPreviews = Boolean(pending && visualKinds.includes(pending.kind));
  const files = pending?.files;
  const kind = pending?.kind;
  const previews = useMemo(
    () =>
      files && kind && visualKinds.includes(kind)
        ? files.map((file) => URL.createObjectURL(file))
        : [],
    [files, kind],
  );
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  if (!pending) return null;

  const saving = pending.savingIndex !== null;
  const noun = KIND_NOUNS[pending.kind];
  const count = pending.files.length;
  const title = saving
    ? `Uploading ${count > 1 ? noun.many : noun.one}`
    : `Name your ${count > 1 ? noun.many : noun.one}`;

  const rowStatus = (index: number): RowStatus => {
    if (pending.savingIndex === null) return "naming";
    if (index < pending.savingIndex) return "saved";
    if (index === pending.savingIndex) return "saving";
    return "waiting";
  };

  const setLabel = (index: number, value: string) =>
    setLabels((previous) =>
      previous.map((label, i) => (i === index ? value : label)),
    );

  return (
    <Modal
      open
      onClose={cancel}
      dismissible={false}
      title={title}
      width={520}
      info={
        saving ? undefined : (
          <InfoTip title="Labels">
            Give {count > 1 ? "each upload" : "this upload"} a label to find it
            easily later. Labels default to the file name.
          </InfoTip>
        )
      }
      footer={
        <>
          <Button variant="secondary" onClick={cancel}>
            Cancel
          </Button>
          <Button onClick={() => void commit(labels)} busy={saving}>
            {count > 1 ? `Save ${count} items` : "Save"}
          </Button>
        </>
      }
    >
      {saving && count > 1 ? (
        <p className="mt-0 text-[13px] leading-[1.6] text-muted-foreground">
          {pending.savedCount} of {count} uploaded. Please keep this window
          open. Cancelling stops the upload and removes everything this batch
          has already added.
        </p>
      ) : null}
      <div className="flex flex-col gap-3">
        {pending.files.map((file, index) => {
          const status = rowStatus(index);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 transition-opacity duration-200",
                status === "waiting" && "opacity-50",
              )}
            >
              {showPreviews ? (
                <div
                  style={{ backgroundImage: `url(${previews[index]})` }}
                  className="h-9.5 w-16 shrink-0 rounded-[7px] border border-border bg-cover bg-center"
                />
              ) : (
                <div className="grid h-9.5 w-11 shrink-0 place-items-center rounded-[7px] bg-primary/14 text-primary-soft">
                  {pending.kind === "video" ? (
                    <Film size={17} />
                  ) : (
                    <Music size={17} />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Input
                  value={labels[index] ?? ""}
                  placeholder={stripExtension(file.name)}
                  disabled={saving}
                  onChange={(event) => setLabel(index, event.target.value)}
                />
                <div className="mt-0.75 truncate text-[11.5px] text-subtle-foreground">
                  {file.name}
                </div>
              </div>
              <StatusBadge status={status} />
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
