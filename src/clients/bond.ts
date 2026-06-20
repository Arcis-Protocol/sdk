import {
  type Address,
  type PublicClient,
  type WalletClient,
  type Hash,
  maxUint256,
  decodeEventLog,
} from "viem";
import { revenueBondFactoryAbi } from "../abi/bond.js";
import { erc20Abi } from "../abi/erc20.js";
import type {
  Bond,
  BondStatus,
  BondPosition,
  IssueBondResult,
  PurchaseResult,
  ClaimResult,
  RedeemResult,
} from "../types/index.js";

/**
 * Arcis RevenueBond Client
 *
 * Phase 3 — agents with proven cash flows issue tokenized bonds.
 * Human investors purchase yield-bearing claims. Smart contracts
 * service debt before agent profits.
 */
export class RevenueBond {
  private readonly publicClient: PublicClient;
  private readonly walletClient?: WalletClient;
  private readonly bondFactory: Address;
  private readonly usdc: Address;

  constructor(
    publicClient: PublicClient,
    bondFactory: Address,
    usdc: Address,
    walletClient?: WalletClient,
  ) {
    this.publicClient = publicClient;
    this.bondFactory = bondFactory;
    this.usdc = usdc;
    this.walletClient = walletClient;
  }

  // ── Read ──

  /** Get the total number of bonds issued */
  async bondCount(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "bondCount",
    }) as Promise<bigint>;
  }

  /** Get bond details by ID */
  async getBond(bondId: bigint): Promise<Bond> {
    const raw = (await this.publicClient.readContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "getBond",
      args: [bondId],
    })) as any;

    return {
      id: raw.id,
      agent: raw.agent,
      revenueSource: raw.revenueSource,
      principal: raw.principal,
      filled: raw.filled,
      couponBps: raw.couponBps,
      maturityBlock: raw.maturityBlock,
      issuedBlock: raw.issuedBlock,
      totalCouponPaid: raw.totalCouponPaid,
      status: Number(raw.status) as BondStatus,
    };
  }

  /** Get a holder's position in a bond */
  async holderPosition(bondId: bigint, holder: Address): Promise<BondPosition> {
    const [balance, claimable, supply] = await Promise.all([
      this.publicClient.readContract({
        address: this.bondFactory,
        abi: revenueBondFactoryAbi,
        functionName: "holderBalance",
        args: [bondId, holder],
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: this.bondFactory,
        abi: revenueBondFactoryAbi,
        functionName: "claimableCoupon",
        args: [bondId, holder],
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: this.bondFactory,
        abi: revenueBondFactoryAbi,
        functionName: "bondSupply",
        args: [bondId],
      }) as Promise<bigint>,
    ]);

    const ownershipBps = supply > 0n ? (balance * 10000n) / supply : 0n;

    return { balance, claimable, ownershipBps };
  }

  /** Get escrow balance for a bond */
  async escrowBalance(bondId: bigint): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "escrowBalances",
      args: [bondId],
    }) as Promise<bigint>;
  }

  /** Check if the bond factory is paused */
  async isPaused(): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "paused",
    }) as Promise<boolean>;
  }

  // ── Write ──

  private requireWallet(): WalletClient {
    if (!this.walletClient) throw new Error("Wallet client required for write operations");
    return this.walletClient;
  }

  /** Issue a new revenue bond (agent-only) */
  async issueBond(
    revenueSource: Address,
    principal: bigint,
    couponBps: bigint,
    durationBlocks: bigint,
  ): Promise<IssueBondResult> {
    const wallet = this.requireWallet();
    const account = wallet.account!;

    const hash = await wallet.writeContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "issueBond",
      args: [revenueSource, principal, couponBps, durationBlocks],
      account,
      chain: wallet.chain,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Parse BondIssued event for bondId
    let bondId = 0n;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: revenueBondFactoryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "BondIssued") {
          bondId = (decoded.args as any).bondId;
          break;
        }
      } catch { /* not our event */ }
    }

    return { txHash: hash, bondId };
  }

  /** Purchase bond tokens with USDC */
  async purchase(bondId: bigint, amount: bigint): Promise<PurchaseResult> {
    const wallet = this.requireWallet();
    const account = wallet.account!;

    // Approve USDC if needed
    const allowance = (await this.publicClient.readContract({
      address: this.usdc,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, this.bondFactory],
    })) as bigint;

    if (allowance < amount) {
      const approveHash = await wallet.writeContract({
        address: this.usdc,
        abi: erc20Abi,
        functionName: "approve",
        args: [this.bondFactory, maxUint256],
        account,
        chain: wallet.chain,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "purchase",
      args: [bondId, amount],
      account,
      chain: wallet.chain,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Parse BondPurchased event for tokens received
    let tokens = 0n;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: revenueBondFactoryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "BondPurchased") {
          tokens = (decoded.args as any).amount;
          break;
        }
      } catch { /* not our event */ }
    }

    return { txHash: hash, tokens };
  }

  /** Claim accrued coupon payments */
  async claimCoupon(bondId: bigint): Promise<ClaimResult> {
    const wallet = this.requireWallet();
    const hash = await wallet.writeContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "claimCoupon",
      args: [bondId],
      account: wallet.account!,
      chain: wallet.chain,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let payout = 0n;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: revenueBondFactoryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "CouponPaid") {
          payout = (decoded.args as any).totalPaid;
          break;
        }
      } catch { /* not our event */ }
    }

    return { txHash: hash, payout };
  }

  /** Redeem principal at maturity */
  async redeem(bondId: bigint): Promise<RedeemResult> {
    const wallet = this.requireWallet();
    const hash = await wallet.writeContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "redeem",
      args: [bondId],
      account: wallet.account!,
      chain: wallet.chain,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return { txHash: hash, principal: 0n }; // Principal returned via USDC transfer
  }

  /** Service debt from escrowed revenue */
  async serviceDebt(bondId: bigint): Promise<Hash> {
    const wallet = this.requireWallet();
    return wallet.writeContract({
      address: this.bondFactory,
      abi: revenueBondFactoryAbi,
      functionName: "serviceDebt",
      args: [bondId],
      account: wallet.account!,
      chain: wallet.chain,
    });
  }
}
