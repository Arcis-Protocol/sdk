import {
  type Address,
  type PublicClient,
  type WalletClient,
  type Hash,
} from "viem";
import { agentCreditAbi } from "../abi/credit.js";
import type {
  ArcisConfig,
  Loan,
  LoanHealth,
  BorrowResult,
} from "../types/index.js";

/**
 * AgentCredit — Identity-aware lending for agents.
 *
 * Borrow USDC against raUSDC collateral. Collateral ratios determined
 * by ERC-8004 reputation score. Higher reputation = lower requirements.
 *
 * @example
 * ```ts
 * const credit = new AgentCredit(config, publicClient, walletClient);
 *
 * // Check my collateral ratio
 * const ratio = await credit.collateralRatio(agentAddress);
 *
 * // Borrow 5000 USDC with raUSDC collateral
 * const { loanId } = await credit.borrow(parseUSDC("5000"), collateralShares);
 *
 * // Check loan health
 * const health = await credit.loanHealth(loanId);
 *
 * // Repay
 * await credit.repay(loanId);
 * ```
 */
export class AgentCredit {
  public readonly config: ArcisConfig;
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient | undefined;

  constructor(
    config: ArcisConfig,
    publicClient: PublicClient,
    walletClient?: WalletClient,
  ) {
    this.config = config;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  // ════════════════════════════════════════════════════════════════
  //                    LENDING OPERATIONS
  // ════════════════════════════════════════════════════════════════

  /**
   * Borrow USDC against raUSDC collateral.
   * Agent must have approved the credit contract to transfer raUSDC shares.
   */
  async borrow(
    borrowAmount: bigint,
    collateralShares: bigint,
  ): Promise<BorrowResult> {
    this.requireWallet();

    const txHash = await this.walletClient!.writeContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "borrow",
      args: [borrowAmount, collateralShares],
      account: this.walletClient!.account!,
      chain: null,
    });

    await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // Extract loanId from LoanCreated event
    // For now, read loanCount as a fallback
    const loanId = 0n; // Will be parsed from event in production

    return { txHash, loanId };
  }

  /**
   * Repay a loan. Returns collateral to the agent.
   * Agent must have approved credit contract to pull USDC for repayment.
   */
  async repay(loanId: bigint): Promise<Hash> {
    this.requireWallet();

    const txHash = await this.walletClient!.writeContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "repay",
      args: [loanId],
      account: this.walletClient!.account!,
      chain: null,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  /**
   * Liquidate an undercollateralized loan.
   * Caller pays the debt and receives the collateral.
   */
  async liquidate(loanId: bigint): Promise<Hash> {
    this.requireWallet();

    const txHash = await this.walletClient!.writeContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "liquidate",
      args: [loanId],
      account: this.walletClient!.account!,
      chain: null,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  // ════════════════════════════════════════════════════════════════
  //                         READS
  // ════════════════════════════════════════════════════════════════

  /** Get collateral ratio for an agent (in bps, e.g. 15000 = 150%) */
  async collateralRatio(agent: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "getCollateralRatio",
      args: [agent],
    });
  }

  /** Check if a loan is healthy */
  async loanHealth(loanId: bigint): Promise<LoanHealth> {
    const [healthy, healthFactor] = await this.publicClient.readContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "isHealthy",
      args: [loanId],
    });

    return { healthy, healthFactor };
  }

  /** Get total amount owed on a loan */
  async totalOwed(loanId: bigint): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "totalOwed",
      args: [loanId],
    });
  }

  /** Get loan details */
  async getLoan(loanId: bigint): Promise<Loan> {
    const result = await this.publicClient.readContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "loans",
      args: [loanId],
    });

    return {
      id: result[0],
      agent: result[1],
      borrowedAmount: result[2],
      collateralShares: result[3],
      interestRateBps: result[4],
      accruedInterest: result[5],
      startBlock: result[6],
      lastAccrualBlock: result[7],
      repaid: result[8],
    };
  }

  /** Get available lending pool size */
  async lendingPool(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "lendingPool",
    });
  }

  /** Get total borrowed across all loans */
  async totalBorrowed(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.credit,
      abi: agentCreditAbi,
      functionName: "totalBorrowed",
    });
  }

  // ════════════════════════════════════════════════════════════════
  //                       INTERNAL
  // ════════════════════════════════════════════════════════════════

  private requireWallet(): void {
    if (!this.walletClient?.account) {
      throw new Error("Wallet client with account required for write operations");
    }
  }
}
