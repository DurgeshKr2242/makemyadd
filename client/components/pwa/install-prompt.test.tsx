import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InstallPrompt } from "./install-prompt";

const setUserAgent = (ua: string) => {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
};

const setStandalone = (value: boolean) => {
  // matchMedia mock
  window.matchMedia = vi.fn().mockReturnValue({
    matches: value,
    media: "(display-mode: standalone)",
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  });
};

describe("InstallPrompt", () => {
  beforeEach(() => {
    setStandalone(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when running in standalone mode", () => {
    setStandalone(true);
    setUserAgent("Mozilla/5.0 Chrome/120");
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders iOS share-menu hint on iPhone Safari (no beforeinstallprompt)", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
    );
    render(<InstallPrompt />);
    expect(
      screen.getByText(/Tap Share, then "Add to Home Screen"/i),
    ).toBeInTheDocument();
  });

  it("renders nothing on desktop until beforeinstallprompt fires", () => {
    setUserAgent("Mozilla/5.0 Chrome/120");
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });
});
