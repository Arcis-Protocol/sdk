import type { ArcisAddresses, ArcisConfig, SupportedChainId } from "../types/index.js";

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
  chainId: 8453 as SupportedChainId,
  addresses: BASE_ADDRESSES,
} as const;

// ── Base Sepolia Testnet ──
// Deployed 2026-05-19 — all contracts verified on-chain

export const BASE_SEPOLIA_ADDRESSES: ArcisAddresses = {
  vault: "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d",
  credit: "0xdf31800e620f728297340d66acf5a306f07ce7a1",
  router: "0x0281e7D37683c585325004F84e0b94170c78d5B4",
  usdc: "0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05",   // MockUSDC
} as const;

export const BASE_SEPOLIA_CONFIG: ArcisConfig = {
  chainId: 84532 as SupportedChainId,
  addresses: BASE_SEPOLIA_ADDRESSES,
} as const;

/** Additional testnet-only addresses */
export const BASE_SEPOLIA_EXTRAS = {
  identityRegistry: "0x79E79629DB86CFb8feF9594621882b065EBC80A7",
  mockStrategy: "0x9d6FB397224141FD323096e95667d3Ae5D9FF9cC",
  strategyAllocator: "0x9f101e1159AA530dC5Cb104decB32aBA1eAF2617",
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
