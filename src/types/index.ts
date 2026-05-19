import type { Address, Hash } from "viem";

// ── Chain Config ──

export type SupportedChainId = 8453; // Base mainnet

export interface ArcisAddresses {
  vault: Address;
  credit: Address;
  router: Address;
  usdc: Address;
}

export interface ArcisConfig {
  chainId: SupportedChainId;
  addresses: ArcisAddresses;
  rpcUrl?: string;
}

// ── Vault Types ──

export interface VaultPosition {
  /** raUSDC share balance (raw, 6 decimals) */
  shares: bigint;
  /** USDC value of position (6 decimals) */
  value: bigint;
  /** Share of total vault in bps */
  vaultShareBps: bigint;
}

export interface VaultState {
  /** Total USDC managed by vault */
  totalAssets: bigint;
  /** Total raUSDC supply */
  totalSupply: bigint;
  /** Current exchange rate (WAD) */
  exchangeRate: bigint;
  /** Remaining deposit capacity (USDC) */
  remainingCapacity: bigint;
  /** Whether vault is paused */
  paused: boolean;
  /** Deposit cap (USDC) */
  depositCap: bigint;
  /** Reserve balance (USDC) */
  reserveBalance: bigint;
  /** Deployed balance (USDC) */
  deployedBalance: bigint;
}

export interface DepositResult {
  /** Transaction hash */
  txHash: Hash;
  /** raUSDC shares received */
  shares: bigint;
  /** USDC amount deposited */
  amount: bigint;
}

export interface WithdrawResult {
  /** Transaction hash */
  txHash: Hash;
  /** USDC amount received */
  amount: bigint;
  /** raUSDC shares burned */
  shares: bigint;
}

// ── Credit Types ──

export type ReputationTier = 0 | 1 | 2 | 3 | 4;

export interface Loan {
  id: bigint;
  agent: Address;
  borrowedAmount: bigint;
  collateralShares: bigint;
  interestRateBps: bigint;
  accruedInterest: bigint;
  startBlock: bigint;
  lastAccrualBlock: bigint;
  repaid: boolean;
}

export interface LoanHealth {
  healthy: boolean;
  healthFactor: bigint;
}

export interface CreditState {
  lendingPool: bigint;
  totalBorrowed: bigint;
  collateralRatios: readonly [bigint, bigint, bigint, bigint, bigint];
}

export interface BorrowResult {
  txHash: Hash;
  loanId: bigint;
}

// ── Formatting ──

export interface FormatOptions {
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Whether to include $ prefix (default: true) */
  prefix?: boolean;
}
