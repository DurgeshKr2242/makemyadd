import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

class GroqMock {
  chat = { completions: { create } };
  constructor(_: unknown) {}
}
vi.mock("groq-sdk", () => ({ default: GroqMock }));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { GROQ_API_KEY: "gsk_test", GROQ_VISION_MODEL: undefined },
  requireServerEnv: () => "gsk_test",
}));

afterEach(() => {
  create.mockReset();
  vi.restoreAllMocks();
});

import { describeProductImage, VisionError } from "./vision";

describe("describeProductImage", () => {
  it("returns the parsed JSON on the first try", async () => {
    create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Festival Saree",
              description: "Hand-woven cotton",
              category: "fashion",
            }),
          },
        },
      ],
    });
    const r = await describeProductImage(
      "https://assets.adcreator.in/uploads/u/x.png",
    );
    expect(r).toEqual({
      name: "Festival Saree",
      description: "Hand-woven cotton",
      category: "fashion",
    });
    expect(create).toHaveBeenCalledOnce();
  });

  it("retries on bad JSON and succeeds on the second attempt", async () => {
    create
      .mockResolvedValueOnce({
        choices: [{ message: { content: "not json" } }],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "X",
                description: "desc",
                category: "home",
              }),
            },
          },
        ],
      });
    const r = await describeProductImage("https://x.png");
    expect(r.name).toBe("X");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("throws VisionError after 3 strikes", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: "still not json" } }],
    });
    await expect(describeProductImage("https://x.png")).rejects.toBeInstanceOf(
      VisionError,
    );
    expect(create).toHaveBeenCalledTimes(3);
  });
});
