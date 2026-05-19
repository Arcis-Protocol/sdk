import type { ArcisAddresses, ArcisConfig } from "../types/index.js";

// ── Base Mainnet ──
// NOTE: Vault/Credit/Router addresses are placeholders until mainnet deployment
// USDC is the real Base mainnet USDC address

export const BASE_ADDRESSES: ArcisAddresses = {
  vault: "0x0000000000000000000000000000000000000000", // TODO: set after deploy
  credit: "0x0000000000000000000000000000000000000000", // TODO: Phase 2
  router: "0x0000000000000000000000000000000000000000", // TODO: set after deploy
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
} as const;

export const BASE_CONFIG: ArcisConfig = {
  chainId: 8453,
  addresses: BASE_ADDRESSES,
} as const;

// ── Constants ──

export const USDC_DECIMALS = 6;
export const WAD = 10n ** 18n;
export const BPS_DENOMINATOR = 10_000n;

/** Reputation tier labels */
export const TIER_LABELS = [
  "No Identity",
  "Novice",
  "Active",
  "Established",
  "Elite",
] as const;

/** Default collateral ratios per tier (in bps) */
export const DEFAULT_COLLATERAL_RATIOS = [
  20_000n, // 200%
  17_500n, // 175%
  15_000n, // 150%
  13_000n, // 130%
  11_500n, // 115%
] as const;
