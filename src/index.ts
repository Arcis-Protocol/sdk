// ── Clients ──
export { Arcis } from "./clients/index.js";
export { ArcisVault } from "./clients/vault.js";
export { AgentCredit } from "./clients/credit.js";

// ── Types ──
export type {
  ArcisConfig,
  ArcisAddresses,
  SupportedChainId,
  VaultPosition,
  VaultState,
  DepositResult,
  WithdrawResult,
  ReputationTier,
  Loan,
  LoanHealth,
  CreditState,
  BorrowResult,
  FormatOptions,
} from "./types/index.js";

// ── ABIs ──
export { arcisVaultAbi } from "./abi/vault.js";
export { agentCreditAbi } from "./abi/credit.js";
export { erc20Abi } from "./abi/erc20.js";

// ── Utils ──
export {
  parseUSDC,
  formatUSDC,
  formatBps,
  formatExchangeRate,
  formatCollateralRatio,
  formatHealthFactor,
} from "./utils/format.js";

export {
  BASE_CONFIG,
  BASE_ADDRESSES,
  BASE_SEPOLIA_CONFIG,
  BASE_SEPOLIA_ADDRESSES,
  BASE_SEPOLIA_EXTRAS,
  USDC_DECIMALS,
  WAD,
  BPS_DENOMINATOR,
  TIER_LABELS,
  DEFAULT_COLLATERAL_RATIOS,
} from "./utils/constants.js";
