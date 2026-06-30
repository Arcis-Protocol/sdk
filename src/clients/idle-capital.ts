/**
 * Arcis Protocol — Idle Capital Manager
 *
 * Monitors an agent's USDC balance and auto-deposits idle capital
 * into the Arcis vault. Auto-withdraws when the agent needs funds.
 *
 * Works with any agent framework: ElizaOS, LangChain, Virtuals,
 * OpenClaw, Hermes, Bankr, OpenAI Agents, Claude SDK, or custom.
 *
 * @example
 * ```ts
 * import { IdleCapitalManager, BASE_CONFIG } from "@arcisprotocol/sdk";
 * import { createPublicClient, createWalletClient, http } from "viem";
 * import { base } from "viem/chains";
 * import { privateKeyToAccount } from "viem/accounts";
 *
 * const account = privateKeyToAccount(process.env.KEY as `0x${string}`);
 * const pub = createPublicClient({ chain: base, transport: http() });
 * const wall = createWalletClient({ chain: base, transport: http(), account });
 *
 * const manager = new IdleCapitalManager(BASE_CONFIG, pub, wall, {
 *   depositThreshold: 100_000_000n, // $100
 *   reserveMinimum:    20_000_000n, // $20
 *   withdrawTrigger:    5_000_000n, // $5
 *   intervalMs: 60_000,
 * });
 *
 * manager.start();
 * ```
 */

import {
  type Address,
  type PublicClient,
  type WalletClient,
  type Hash,
  formatUnits,
  maxUint256,
} from "viem";
import { arcisVaultAbi } from "../abi/vault.js";
import { erc20Abi } from "../abi/erc20.js";
import type { ArcisConfig } from "../types/index.js";

// ── Types ──

export interface IdleCapitalOptions {
  /** Deposit when wallet USDC exceeds this (raw 6-decimal, e.g. 100_000_000n = $100) */
  depositThreshold: bigint;

  /** Keep at least this much USDC in wallet (raw 6-decimal) */
  reserveMinimum: bigint;

  /** Auto-withdraw when wallet drops below this (raw 6-decimal) */
  withdrawTrigger: bigint;

  /** How much to withdraw per trigger (raw 6-decimal). Defaults to reserveMinimum */
  withdrawAmount?: bigint;

  /** Check interval in ms (default: 60000) */
  intervalMs?: number;

  /** Callbacks */
  onDeposit?: (amount: bigint, shares: bigint, tx: Hash) => void;
  onWithdraw?: (shares: bigint, amount: bigint, tx: Hash) => void;
  onError?: (error: Error, action: string) => void;
  onTick?: (status: IdleCapitalStatus) => void;
}

export interface IdleCapitalStatus {
  walletUsdc: bigint;
  vaultValue: bigint;
  vaultShares: bigint;
  totalCapital: bigint;
  action: "deposit" | "withdraw" | "hold" | "paused";
  timestamp: number;
}

// ── Manager ──

export class IdleCapitalManager {
  private config: ArcisConfig;
  private pub: PublicClient;
  private wall: WalletClient;
  private opts: Required<IdleCapitalOptions>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private _running = false;

  constructor(
    config: ArcisConfig,
    publicClient: PublicClient,
    walletClient: WalletClient,
    options: IdleCapitalOptions,
  ) {
    this.config = config;
    this.pub = publicClient;
    this.wall = walletClient;
    this.opts = {
      ...options,
      withdrawAmount: options.withdrawAmount ?? options.reserveMinimum,
      intervalMs: options.intervalMs ?? 60_000,
      onDeposit: options.onDeposit ?? (() => {}),
      onWithdraw: options.onWithdraw ?? (() => {}),
      onError: options.onError ?? ((e) => console.error(`[Arcis:IdleCapital] ${e.message}`)),
      onTick: options.onTick ?? (() => {}),
    };
  }

  // ── Public API ──

  get isRunning(): boolean { return this._running; }

  get agentAddress(): Address {
    return this.wall.account!.address;
  }

  /** Start automatic monitoring */
  start(): void {
    if (this._running) return;
    this._running = true;
    this.tick();
    this.timer = setInterval(() => this.tick(), this.opts.intervalMs);
  }

  /** Stop monitoring */
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this._running = false;
  }

  /** Check current status without taking action */
  async check(): Promise<IdleCapitalStatus> {
    const agent = this.agentAddress;
    const vault = this.config.addresses.vault as Address;
    const usdc = this.config.addresses.usdc as Address;

    const [walletUsdc, vaultValue, vaultShares, paused] = await Promise.all([
      this.pub.readContract({ address: usdc, abi: erc20Abi, functionName: "balanceOf", args: [agent] }) as Promise<bigint>,
      this.pub.readContract({ address: vault, abi: arcisVaultAbi, functionName: "balance", args: [agent] }) as Promise<bigint>,
      this.pub.readContract({ address: vault, abi: arcisVaultAbi, functionName: "balanceOf", args: [agent] }) as Promise<bigint>,
      this.pub.readContract({ address: vault, abi: arcisVaultAbi, functionName: "paused" }) as Promise<boolean>,
    ]);

    let action: IdleCapitalStatus["action"] = "hold";
    if (paused) action = "paused";
    else if (walletUsdc > this.opts.depositThreshold) action = "deposit";
    else if (walletUsdc < this.opts.withdrawTrigger && vaultShares > 0n) action = "withdraw";

    return {
      walletUsdc,
      vaultValue,
      vaultShares,
      totalCapital: walletUsdc + vaultValue,
      action,
      timestamp: Date.now(),
    };
  }

  /** Deposit USDC into vault */
  async deposit(amount: bigint): Promise<Hash> {
    const vault = this.config.addresses.vault as Address;
    const usdc = this.config.addresses.usdc as Address;
    const agent = this.agentAddress;

    // Check allowance
    const allowance = await this.pub.readContract({
      address: usdc, abi: erc20Abi, functionName: "allowance", args: [agent, vault],
    }) as bigint;

    if (allowance < amount) {
      const approveTx = await this.wall.writeContract({
        address: usdc, abi: erc20Abi, functionName: "approve", args: [vault, maxUint256],
      });
      await this.pub.waitForTransactionReceipt({ hash: approveTx });
    }

    const tx = await this.wall.writeContract({
      address: vault, abi: arcisVaultAbi, functionName: "deposit", args: [amount],
    });
    await this.pub.waitForTransactionReceipt({ hash: tx });

    const newShares = await this.pub.readContract({
      address: vault, abi: arcisVaultAbi, functionName: "balanceOf", args: [agent],
    }) as bigint;

    this.opts.onDeposit(amount, newShares, tx);
    return tx;
  }

  /** Withdraw shares from vault */
  async withdraw(shares: bigint): Promise<Hash> {
    const vault = this.config.addresses.vault as Address;

    const tx = await this.wall.writeContract({
      address: vault, abi: arcisVaultAbi, functionName: "withdraw", args: [shares],
    });
    await this.pub.waitForTransactionReceipt({ hash: tx });

    const walletUsdc = await this.pub.readContract({
      address: this.config.addresses.usdc as Address,
      abi: erc20Abi, functionName: "balanceOf", args: [this.agentAddress],
    }) as bigint;

    this.opts.onWithdraw(shares, walletUsdc, tx);
    return tx;
  }

  /** Get current position */
  async position(): Promise<{ shares: bigint; value: bigint; walletUsdc: bigint }> {
    const agent = this.agentAddress;
    const vault = this.config.addresses.vault as Address;
    const usdc = this.config.addresses.usdc as Address;

    const [shares, value, walletUsdc] = await Promise.all([
      this.pub.readContract({ address: vault, abi: arcisVaultAbi, functionName: "balanceOf", args: [agent] }) as Promise<bigint>,
      this.pub.readContract({ address: vault, abi: arcisVaultAbi, functionName: "balance", args: [agent] }) as Promise<bigint>,
      this.pub.readContract({ address: usdc, abi: erc20Abi, functionName: "balanceOf", args: [agent] }) as Promise<bigint>,
    ]);
    return { shares, value, walletUsdc };
  }

  // ── Internal ──

  private async tick(): Promise<void> {
    try {
      const status = await this.check();
      this.opts.onTick(status);

      if (status.action === "deposit") {
        const excess = status.walletUsdc - this.opts.reserveMinimum;
        if (excess > 0n) await this.deposit(excess);
      } else if (status.action === "withdraw") {
        const toWithdraw = status.vaultShares < this.opts.withdrawAmount
          ? status.vaultShares
          : this.opts.withdrawAmount;
        if (toWithdraw > 0n) await this.withdraw(toWithdraw);
      }
    } catch (err) {
      this.opts.onError(err instanceof Error ? err : new Error(String(err)), "tick");
    }
  }
}
