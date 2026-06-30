// ── Clients ──
export { Arcis } from "./clients/index.js";
export { ArcisVault } from "./clients/vault.js";
export { AgentCredit } from "./clients/credit.js";
export { RevenueBond } from "./clients/bond.js";
export { IdleCapitalManager } from "./clients/idle-capital.js";

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
  Bond,
  BondPosition,
  IssueBondResult,
  PurchaseResult,
  ClaimResult,
  RedeemResult,
} from "./types/index.js";

export { BondStatus } from "./types/index.js";

// ── ABIs ──
export { arcisVaultAbi } from "./abi/vault.js";
export { agentCreditAbi } from "./abi/credit.js";
export { revenueBondFactoryAbi } from "./abi/bond.js";
export { erc20Abi } from "./abi/erc20.js";

// ── Utils ──
export type {
  IdleCapitalOptions,
  IdleCapitalStatus,
} from "./clients/idle-capital.js";

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
  BASE_ADDRESSES_EXTENDED,
  USDC_DECIMALS,
  WAD,
  BPS_DENOMINATOR,
  TIER_LABELS,
  DEFAULT_COLLATERAL_RATIOS,
  AAVE_POOL_BASE,
  VAULT_ALLOCATION_BPS,
  VAULT_FEE_BPS,
} from "./utils/constants.js";
