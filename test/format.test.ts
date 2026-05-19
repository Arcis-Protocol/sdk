import { describe, it, expect } from "vitest";
import {
  parseUSDC,
  formatUSDC,
  formatBps,
  formatExchangeRate,
  formatCollateralRatio,
  formatHealthFactor,
} from "../src/utils/format";

describe("parseUSDC", () => {
  it("parses whole numbers", () => {
    expect(parseUSDC("1000")).toBe(1_000_000_000n);
  });

  it("parses decimals", () => {
    expect(parseUSDC("100.50")).toBe(100_500_000n);
  });

  it("parses small amounts", () => {
    expect(parseUSDC("0.01")).toBe(10_000n);
  });

  it("parses from number", () => {
    expect(parseUSDC(500)).toBe(500_000_000n);
  });

  it("handles max USDC precision", () => {
    expect(parseUSDC("1.123456")).toBe(1_123_456n);
  });

  it("truncates extra decimals", () => {
    expect(parseUSDC("1.1234567")).toBe(1_123_456n);
  });
});

describe("formatUSDC", () => {
  it("formats with default options", () => {
    expect(formatUSDC(1_000_000_000n)).toBe("$1,000.00");
  });

  it("formats small amounts", () => {
    expect(formatUSDC(10_000n)).toBe("$0.01");
  });

  it("formats without prefix", () => {
    expect(formatUSDC(1_000_000n, { prefix: false })).toBe("1.00");
  });

  it("formats with custom decimals", () => {
    expect(formatUSDC(1_123_456n, { decimals: 4 })).toBe("$1.1234");
  });

  it("formats zero", () => {
    expect(formatUSDC(0n)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(formatUSDC(1_000_000_000_000n)).toBe("$1,000,000.00");
  });
});

describe("formatBps", () => {
  it("formats standard bps", () => {
    expect(formatBps(450n)).toBe("4.50%");
  });

  it("formats small bps", () => {
    expect(formatBps(25n)).toBe("0.25%");
  });

  it("formats large bps", () => {
    expect(formatBps(10_000n)).toBe("100.00%");
  });
});

describe("formatCollateralRatio", () => {
  it("formats 200%", () => {
    expect(formatCollateralRatio(20_000n)).toBe("200%");
  });

  it("formats 115%", () => {
    expect(formatCollateralRatio(11_500n)).toBe("115%");
  });
});

describe("formatHealthFactor", () => {
  it("formats healthy factor", () => {
    expect(formatHealthFactor(1_500_000_000_000_000_000n)).toBe("1.50");
  });

  it("formats critical factor", () => {
    expect(formatHealthFactor(1_050_000_000_000_000_000n)).toBe("1.05");
  });

  it("formats zero", () => {
    expect(formatHealthFactor(0n)).toBe("0.00");
  });
});

describe("formatExchangeRate", () => {
  it("formats 1:1 rate", () => {
    expect(formatExchangeRate(1_000_000_000_000_000_000n)).toBe("1.0000");
  });

  it("formats rate above 1", () => {
    const rate = 1_050_000_000_000_000_000n; // 1.05
    expect(formatExchangeRate(rate)).toBe("1.0500");
  });
});
