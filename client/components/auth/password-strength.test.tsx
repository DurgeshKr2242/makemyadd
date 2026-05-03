import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrength, scorePassword } from "./password-strength";

describe("scorePassword", () => {
  it("scores empty as 0", () => {
    expect(scorePassword("")).toBe(0);
  });
  it("gives length-only passwords a low score", () => {
    expect(scorePassword("aaaaaaaa")).toBe(1);
  });
  it("rewards numbers, symbols, mixed case", () => {
    expect(scorePassword("aaaa1aaa")).toBe(2);
    expect(scorePassword("aaaa1!aa")).toBe(3);
    expect(scorePassword("aaaa1!Aa")).toBe(4);
  });
});

describe("<PasswordStrength>", () => {
  it("renders 4 segments and exposes a progressbar", () => {
    render(<PasswordStrength password="aaaa1!Aa" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "4");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
  });

  it("hides itself when password is empty", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });
});
