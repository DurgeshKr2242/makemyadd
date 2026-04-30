import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMockGeneration } from "./use-mock-generation";

describe("useMockGeneration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("transitions idle → running → complete and produces 3 variants", async () => {
    const { result } = renderHook(() => useMockGeneration("en"));

    expect(result.current.status).toBe("idle");
    expect(result.current.variants).toHaveLength(0);

    await act(async () => {
      result.current.start();
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(result.current.status).toBe("complete");
    expect(result.current.variants).toHaveLength(3);
    // All steps should be done
    for (const step of result.current.steps) {
      expect(step.status).toBe("done");
    }
  });

  it("reset() clears variants and returns to idle", async () => {
    const { result } = renderHook(() => useMockGeneration("hi"));

    await act(async () => {
      result.current.start();
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(result.current.status).toBe("complete");
    expect(result.current.variants).toHaveLength(3);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.variants).toHaveLength(0);
    expect(result.current.steps.every((s) => s.status === "pending")).toBe(
      true,
    );
  });
});
