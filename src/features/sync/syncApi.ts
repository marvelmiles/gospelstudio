import { z } from "zod";
import {
  FALLBACK_FILE_CONTENT_TYPE,
  SYNC_CHANGES_PATH,
  SYNC_HEADERS,
  SYNC_PUSH_PATH,
  changesResponseSchema,
  pushResponseSchema,
  pushResultSchema,
  syncFilePath,
  type ChangesPage,
  type LocalChange,
  type PushResult,
} from "@/contracts/syncContract";
import { ApiRequestError } from "../../lib/jsonApi";
import {
  callAccountApi,
  sendAccountRequest,
} from "../account/api/authorizedApi";

const uploadResponseSchema = z.object({ data: pushResultSchema });

export const pushChanges = async (
  deviceId: string,
  changes: LocalChange[],
  signal: AbortSignal,
): Promise<PushResult[]> =>
  (
    await callAccountApi({
      path: SYNC_PUSH_PATH,
      method: "POST",
      body: { deviceId, changes },
      dataSchema: pushResponseSchema,
      signal,
    })
  ).results;

export const fetchChanges = (
  after: number,
  signal: AbortSignal,
): Promise<ChangesPage> =>
  callAccountApi({
    path: `${SYNC_CHANGES_PATH}?after=${after}`,
    dataSchema: changesResponseSchema,
    signal,
  });

export interface FileUpload {
  fileId: string;
  blob: Blob;
  deviceId: string;
  changedAt: string;
  signal: AbortSignal;
}

export const uploadFile = async ({
  fileId,
  blob,
  deviceId,
  changedAt,
  signal,
}: FileUpload): Promise<PushResult> => {
  const response = await sendAccountRequest({
    path: syncFilePath(fileId),
    method: "PUT",
    headers: {
      "Content-Type": blob.type || FALLBACK_FILE_CONTENT_TYPE,
      [SYNC_HEADERS.deviceId]: deviceId,
      [SYNC_HEADERS.changedAt]: changedAt,
    },
    body: blob,
    signal,
  });
  const parsed = uploadResponseSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new ApiRequestError(
      "invalid_response",
      "The account service sent an upload answer this page can't read.",
      response.status,
    );
  return parsed.data.data;
};

export type ByteProgress = (loadedBytes: number) => void;

type ByteChunk = Uint8Array<ArrayBuffer>;

const readWithProgress = async (
  body: ReadableStream<ByteChunk>,
  onProgress: ByteProgress,
): Promise<ByteChunk[]> => {
  const reader = body.getReader();
  const chunks: ByteChunk[] = [];
  let loadedBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    chunks.push(value);
    loadedBytes += value.byteLength;
    onProgress(loadedBytes);
  }
};

export interface FileDownload {
  fileId: string;
  contentType: string;
  signal: AbortSignal;
  onProgress: ByteProgress;
}

export const downloadFile = async ({
  fileId,
  contentType,
  signal,
  onProgress,
}: FileDownload): Promise<Blob> => {
  const response = await sendAccountRequest({
    path: syncFilePath(fileId),
    method: "GET",
    signal,
  });
  const parts = response.body
    ? await readWithProgress(response.body, onProgress)
    : [await response.arrayBuffer()];
  return new Blob(parts, { type: contentType });
};
