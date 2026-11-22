import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiRequestError, requestJson } from "./jsonApi";

const request = (init: RequestInit = {}) =>
  requestJson({
    url: "https://relay.example/v1/sessions",
    init,
    dataSchema: z.object({ ok: z.boolean() }),
    serviceName: "streaming relay",
  });

const failFetchWith = (error: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw error;
    }),
  );

afterEach(() => vi.unstubAllGlobals());

describe("JSON requests", () => {
  it("explains a timeout instead of passing the raw error on", async () => {
    failFetchWith(new DOMException("The operation timed out.", "TimeoutError"));
    const error = await request({ signal: AbortSignal.timeout(1) }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ code: "timeout" });
    expect((error as Error).message).toMatch(/took too long/);
  });

  it("passes a deliberate cancel through untouched", async () => {
    const controller = new AbortController();
    controller.abort();
    const cancelled = new DOMException("Aborted", "AbortError");
    failFetchWith(cancelled);
    await expect(request({ signal: controller.signal })).rejects.toBe(
      cancelled,
    );
  });

  it("reports an unreachable service as a network problem", async () => {
    failFetchWith(new TypeError("Failed to fetch"));
    await expect(request()).rejects.toMatchObject({ code: "network" });
  });

  it("shows the service's own error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "forbidden_origin",
                message: "Add it to ALLOWED_ORIGINS.",
              },
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    await expect(request()).rejects.toMatchObject({
      code: "forbidden_origin",
      message: "Add it to ALLOWED_ORIGINS.",
    });
  });
});
