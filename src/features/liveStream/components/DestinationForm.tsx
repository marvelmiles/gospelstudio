import { useState, type FormEvent } from "react";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Field } from "@/components/shared/Field";
import { IconButton } from "@/components/shared/IconButton";
import {
  saveDestination,
  streamDestinationFormSchema,
  streamUrlOf,
  useLiveStreamSettings,
  type StreamDestination,
  type StreamDestinationForm,
} from "../lib/liveStreamSettings";
import {
  STREAM_PLATFORM_LIST,
  STREAM_PLATFORMS,
  streamPlatformIdSchema,
  type StreamPlatformId,
} from "../lib/streamPlatforms";
import { buildStreamUrl } from "@/contracts/streamUrl";
import { PlatformIcon } from "./PlatformIcon";

type FieldName = keyof StreamDestinationForm;
type FieldErrors = Partial<Record<FieldName, string>>;

interface DestinationFormProps {
  destination: StreamDestination | null;
  onDone: () => void;
}

const DUPLICATE_MESSAGE = "This stream key is already in your list.";

const draftOf = (
  destination: StreamDestination | null,
): StreamDestinationForm =>
  destination
    ? {
        platform: destination.platform,
        label: destination.label,
        serverUrl: destination.serverUrl,
        streamKey: destination.streamKey,
      }
    : {
        platform: "youtube",
        label: "",
        serverUrl: STREAM_PLATFORMS.youtube.defaultServerUrl,
        streamKey: "",
      };

const fieldErrorsOf = (
  error: z.ZodError<StreamDestinationForm>,
): FieldErrors => {
  const errors: FieldErrors = {};
  for (const [field, messages] of Object.entries(error.flatten().fieldErrors))
    if (messages?.[0]) errors[field as FieldName] = messages[0];
  return errors;
};

export const DestinationForm = ({
  destination,
  onDone,
}: DestinationFormProps) => {
  const destinations = useLiveStreamSettings((state) => state.destinations);
  const [draft, setDraft] = useState(() => draftOf(destination));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const platform = STREAM_PLATFORMS[draft.platform];

  const update = (patch: Partial<StreamDestinationForm>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch)) delete next[field as FieldName];
      return next;
    });
  };

  const choosePlatform = (next: StreamPlatformId) =>
    update({
      platform: next,
      serverUrl:
        !draft.serverUrl || draft.serverUrl === platform.defaultServerUrl
          ? STREAM_PLATFORMS[next].defaultServerUrl
          : draft.serverUrl,
    });

  const isDuplicate = (form: StreamDestinationForm): boolean => {
    const url = buildStreamUrl(form.serverUrl, form.streamKey);
    return destinations.some(
      (other) => other.id !== destination?.id && streamUrlOf(other) === url,
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = streamDestinationFormSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }
    if (isDuplicate(parsed.data)) {
      setErrors({ streamKey: DUPLICATE_MESSAGE });
      return;
    }
    saveDestination(parsed.data, destination?.id);
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1">
      <fieldset className="m-0 mb-4 border-0 p-0">
        <legend className="mb-2 text-[11.5px] font-semibold tracking-[0.4px] text-subtle-foreground uppercase">
          Platform
        </legend>
        <ToggleGroup
          type="single"
          value={draft.platform}
          onValueChange={(value) => {
            const parsed = streamPlatformIdSchema.safeParse(value);
            if (parsed.success) choosePlatform(parsed.data);
          }}
          spacing={1}
          className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3"
        >
          {STREAM_PLATFORM_LIST.map((option) => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              aria-label={option.name}
              className="h-10 justify-start gap-2 rounded-lg border px-2.5 text-[12.5px]"
            >
              <PlatformIcon platform={option.id} size={16} />
              <span className="truncate">{option.name}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      <div className="mb-4 rounded-xl border border-info/30 bg-info/8 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {platform.keyInstructions}
        {platform.setupUrl && (
          <a
            href={platform.setupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1 font-semibold text-primary-soft underline-offset-4 hover:underline"
          >
            Open {platform.name}
            <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </div>

      <Field label="Name (optional)" error={errors.label ?? null}>
        <Input
          value={draft.label}
          maxLength={60}
          placeholder={platform.name}
          onChange={(event) => update({ label: event.target.value })}
          aria-invalid={Boolean(errors.label)}
        />
      </Field>

      <Field label="Server URL" error={errors.serverUrl ?? null}>
        <Input
          value={draft.serverUrl}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={platform.serverUrlExample}
          onChange={(event) => update({ serverUrl: event.target.value })}
          aria-invalid={Boolean(errors.serverUrl)}
          className="font-mono text-[13px]"
        />
      </Field>

      <Field label="Stream key" error={errors.streamKey ?? null}>
        <div className="relative">
          <Input
            type={isKeyVisible ? "text" : "password"}
            value={draft.streamKey}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => update({ streamKey: event.target.value })}
            aria-invalid={Boolean(errors.streamKey)}
            className="pr-10 font-mono text-[13px] [&::-ms-reveal]:hidden"
          />
          <IconButton
            icon={isKeyVisible ? EyeOff : Eye}
            size="sm"
            title={isKeyVisible ? "Hide the stream key" : "Show the stream key"}
            onClick={() => setIsKeyVisible((visible) => !visible)}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          />
        </div>
      </Field>

      <p className="m-0 mb-3 text-[12px] leading-relaxed text-subtle-foreground">
        The stream key stays on this device. It is only sent to the streaming
        server while you are live, over an encrypted connection.
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">
          {destination ? "Save changes" : "Add platform"}
        </Button>
      </div>
    </form>
  );
};
