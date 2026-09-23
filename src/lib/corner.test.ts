import { describe, expect, it } from "vitest";
import { cornerBottom } from "./corner";

describe("cornerBottom", () => {
  it("uses the usual margin without an obstacle", () => {
    expect(cornerBottom(null, 800)).toBe(16);
  });

  it("uses the usual margin for a zero-height obstacle", () => {
    expect(cornerBottom({ top: 700, width: 300, height: 0 }, 800)).toBe(16);
  });

  it("positions above an obstacle", () => {
    expect(cornerBottom({ top: 700, width: 300, height: 52 }, 800)).toBe(108);
  });

  it("keeps the usual margin when the obstacle is below the viewport", () => {
    expect(cornerBottom({ top: 900, width: 300, height: 52 }, 800)).toBe(16);
  });

  it("rounds fractional positions", () => {
    expect(cornerBottom({ top: 700.4, width: 300, height: 52 }, 800)).toBe(108);
  });
});
