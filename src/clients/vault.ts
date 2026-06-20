import {
  type Address,
  type PublicClient,
  type WalletClient,
  type Hash,


  maxUint256,
  decodeEventLog,
} from "viem";
import { arcisVaultAbi } from "../abi/vault.js";
import { erc20Abi } from "../abi/erc20.js";
import type {
  ArcisConfig,
  VaultPosition,
  VaultState,
  DepositResult,
  WithdrawResult,
} from "../types/index.js";

/**
 * ArcisVault — The ATI client.
 *
 * Three functions for agents. deposit, withdraw, balance.
 * Plus convenience methods for previews, approvals, and vault state.
 *
 * @example
 * ```ts
 * import { ArcisVault, BASE_CONFIG, parseUSDC } from "@arcis/sdk";
 * import { createPublicClient, createWalletClient, http } from "viem";
 * import { base } from "viem/chains";
 *
 * const public = createPublicClient({ chain: base, transport: http() });
 * const wallet = createWalletClient({ chain: base, transport: http(), account });
 *
 * const vault = new ArcisVault(BASE_CONFIG, public, wallet);
 *
 * // Deposit 1000 USDC
 * const result = await vault.deposit(parseUSDC("1000"));
 *
 * // Check position
 * const pos = await vault.position(agent);
 *
 * // Withdraw all
 * const withdrawn = await vault.withdraw(pos.shares);
 * ```
 */
export class ArcisVault {
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
  //                     ATI INTERFACE
  // ════════════════════════════════════════════════════════════════

  /**
   * Deposit USDC into the vault. Returns raUSDC shares.
   * Automatically approves USDC if needed.
   */
  async deposit(amount: bigint): Promise<DepositResult> {
    this.requireWallet();

    const account = this.walletClient!.account!.address;

    // Check and set approval if needed
    await this.ensureApproval(amount);

    // Execute deposit
    const txHash = await this.walletClient!.writeContract({
      address: this.config.addresses.vault,
      abi: arcisVaultAbi,
      functionName: "deposit",
      args: [amount],
      account: this.walletClient!.account!,
      chain: null,
    });

    // Wait for receipt and extract shares from event
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // Parse Deposit event to get exact shares received
    let shares = 0n;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: arcisVaultAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "Deposit") {
          shares = (decoded.args as any).shares;
          break;
        }
      } catch { /* not our event */ }
    }

    // Fallback: read shares from balanceOf if event parsing failed
    if (shares === 0n) {
      shares = await this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "balanceOf",
        args: [account],
      }) as bigint;
    }

    return { txHash, shares, amount };
  }

  /**
   * Withdraw USDC by redeeming raUSDC shares.
   */
  async withdraw(shares: bigint): Promise<WithdrawResult> {
    this.requireWallet();

    const txHash = await this.walletClient!.writeContract({
      address: this.config.addresses.vault,
      abi: arcisVaultAbi,
      functionName: "withdraw",
      args: [shares],
      account: this.walletClient!.account!,
      chain: null,
    });

    await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // Get USDC balance change from Transfer event
    const amount = await this.previewWithdraw(shares);

    return { txHash, amount, shares };
  }

  /**
   * Get current USDC value of an agent's position.
   */
  async balance(agent: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.vault,
      abi: arcisVaultAbi,
      functionName: "balance",
      args: [agent],
    });
  }

  // ════════════════════════════════════════════════════════════════
  //                     POSITION & STATE
  // ════════════════════════════════════════════════════════════════

  /**
   * Get full position details for an agent.
   */
  async position(agent: Address): Promise<VaultPosition> {
    const [shares, value, totalSupply] = await Promise.all([
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "balanceOf",
        args: [agent],
      }),
      this.balance(agent),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "totalSupply",
      }),
    ]);

    const vaultShareBps =
      totalSupply > 0n ? (shares * 10_000n) / totalSupply : 0n;

    return { shares, value, vaultShareBps };
  }

  /**
   * Get current vault state.
   */
  async state(): Promise<VaultState> {
    const [
      totalAssets,
      totalSupply,
      exchangeRate,
      remainingCapacity,
      paused,
      depositCap,
      reserveBalance,
      deployedBalance,
    ] = await Promise.all([
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "totalAssets",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "totalSupply",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "exchangeRate",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "remainingCapacity",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "paused",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "depositCap",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "reserveBalance",
      }),
      this.publicClient.readContract({
        address: this.config.addresses.vault,
        abi: arcisVaultAbi,
        functionName: "deployedBalance",
      }),
    ]);

    return {
      totalAssets,
      totalSupply,
      exchangeRate,
      remainingCapacity,
      paused,
      depositCap,
      reserveBalance,
      deployedBalance,
    };
  }

  // ════════════════════════════════════════════════════════════════
  //                       PREVIEWS
  // ════════════════════════════════════════════════════════════════

  /** Preview shares received for a deposit amount */
  async previewDeposit(amount: bigint): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.vault,
      abi: arcisVaultAbi,
      functionName: "previewDeposit",
      args: [amount],
    });
  }

  /** Preview USDC received for a share redemption */
  async previewWithdraw(shares: bigint): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.vault,
      abi: arcisVaultAbi,
      functionName: "previewWithdraw",
      args: [shares],
    });
  }

  /** Current exchange rate (WAD) */
  async exchangeRate(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.vault,
      abi: arcisVaultAbi,
      functionName: "exchangeRate",
    });
  }

  // ════════════════════════════════════════════════════════════════
  //                       APPROVALS
  // ════════════════════════════════════════════════════════════════

  /** Ensure USDC approval for vault. Approves max if below required. */
  async ensureApproval(amount: bigint): Promise<Hash | null> {
    this.requireWallet();

    const account = this.walletClient!.account!.address;
    const vaultAddr = this.config.addresses.vault;
    const usdcAddr = this.config.addresses.usdc;

    const currentAllowance = await this.publicClient.readContract({
      address: usdcAddr,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account, vaultAddr],
    });

    if (currentAllowance >= amount) return null;

    const txHash = await this.walletClient!.writeContract({
      address: usdcAddr,
      abi: erc20Abi,
      functionName: "approve",
      args: [vaultAddr, maxUint256],
      account: this.walletClient!.account!,
      chain: null,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  /** Get current USDC balance of an address */
  async usdcBalance(address: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.addresses.usdc,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
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
