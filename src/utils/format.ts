import { USDC_DECIMALS, WAD } from "./constants.js";
import type { FormatOptions } from "../types/index.js";

/** Parse USDC string to raw uint256 (e.g. "100.50" -> 100_500_000n) */
export function parseUSDC(amount: string | number): bigint {
  const str = typeof amount === "number" ? amount.toString() : amount;
  const [whole = "0", frac = ""] = str.split(".");
  const paddedFrac = frac.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt(whole + paddedFrac);
}

/** Format raw USDC uint256 to human-readable string */
export function formatUSDC(raw: bigint, opts?: FormatOptions): string {
  const decimals = opts?.decimals ?? 2;
  const prefix = opts?.prefix ?? true;

  const divisor = 10n ** BigInt(USDC_DECIMALS);
  const whole = raw / divisor;
  const frac = raw % divisor;

  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").slice(0, decimals);
  const numStr = decimals > 0 ? `${whole}.${fracStr}` : whole.toString();

  // Add commas
  const parts = numStr.split(".");
  const withCommas =
    (parts[0] ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (parts[1] ? `.${parts[1]}` : "");

  return prefix ? `$${withCommas}` : withCommas;
}

/** Format basis points to percentage string (e.g. 450n -> "4.50%") */
export function formatBps(bps: bigint): string {
  const whole = bps / 100n;
  const frac = (bps % 100n).toString().padStart(2, "0");
  return `${whole}.${frac}%`;
}

/** Format exchange rate from WAD to human-readable */
export function formatExchangeRate(rate: bigint): string {
  const whole = rate / WAD;
  const frac = ((rate % WAD) * 10000n) / WAD;
  return `${whole}.${frac.toString().padStart(4, "0")}`;
}

/** Format collateral ratio from bps (e.g. 15000n -> "150%") */
export function formatCollateralRatio(ratioBps: bigint): string {
  const pct = ratioBps / 100n;
  return `${pct}%`;
}

/** Format health factor from WAD (e.g. 1.5e18 -> "1.50") */
export function formatHealthFactor(hf: bigint): string {
  const whole = hf / WAD;
  const frac = ((hf % WAD) * 100n) / WAD;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}
