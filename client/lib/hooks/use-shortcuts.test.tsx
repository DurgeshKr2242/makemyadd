import { fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useShortcuts } from "./use-shortcuts";

afterEach(() => vi.restoreAllMocks());

describe("useShortcuts", () => {
  it("fires handler on plain key match", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ keys: "g", handler }]));
    fireEvent.keyDown(window, { key: "g" });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("requires meta when meta:true", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ keys: "k", meta: true, handler }]));
    fireEvent.keyDown(window, { key: "k" });
    expect(handler).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does NOT fire when an input is focused", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ keys: "g", handler }]));
    const { container } = render(<input data-testid="i" />);
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: "g" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useShortcuts([{ keys: "g", handler }]),
    );
    unmount();
    fireEvent.keyDown(window, { key: "g" });
    expect(handler).not.toHaveBeenCalled();
  });
});
