import type { ArcisAddresses, ArcisConfig, SupportedChainId } from "../types/index.js";

// ── Base Mainnet ──
// All 7 contracts deployed and verified on Base mainnet

export const BASE_ADDRESSES: ArcisAddresses = {
  vault: "0x00325d9da832b38179ed2f0dabd4062d93e325a7",
  credit: "0xdf31800e620f728297340d66acf5a306f07ce7a1",
  router: "0xd0c64f997ca9aa427f8834578bd7f0313f868e83",
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
} as const;

export const BASE_ADDRESSES_EXTENDED = {
  ...BASE_ADDRESSES,
  bonds: "0xeb65d8bb08e0ea4a6bb9162d53d1b444f99681ba",
  identity: "0xaa4da295dd368c0f10128654af76e3f002e20e71",
  strategyAave: "0x43626D6162Ccb12328B989BB228DaD2941F2F12a",
  allocator: "0x7Fd5d7b49694858FCf143E0039e83cDB0196DD7A",
} as const;

export const BASE_CONFIG: ArcisConfig = {
  chainId: 8453 as SupportedChainId,
  addresses: BASE_ADDRESSES,
} as const;

// ── Formatting Constants ──

export const USDC_DECIMALS = 6;
export const WAD = 10n ** 18n;
export const BPS_DENOMINATOR = 10_000n;

export const TIER_LABELS: Record<number, string> = {
  0: "Unverified",
  1: "Basic",
  2: "Established",
  3: "Trusted",
  4: "Elite",
};

export const DEFAULT_COLLATERAL_RATIOS: Record<number, number> = {
  0: 200,
  1: 175,
  2: 150,
  3: 130,
  4: 115,
};

// ── Aave (for APY calculation) ──

export const AAVE_POOL_BASE = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
export const VAULT_ALLOCATION_BPS = 7000; // 70% to strategies
export const VAULT_FEE_BPS = 200; // 2% performance fee
