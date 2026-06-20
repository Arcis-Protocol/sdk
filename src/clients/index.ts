import type { PublicClient, WalletClient } from "viem";
import { ArcisVault } from "./vault.js";
import { AgentCredit } from "./credit.js";
import { RevenueBond } from "./bond.js";
import type { ArcisConfig } from "../types/index.js";
import { BASE_CONFIG } from "../utils/constants.js";

/**
 * Arcis — Unified client for all protocol interactions.
 *
 * Wraps ArcisVault and AgentCredit into a single entry point.
 * Use this for the simplest integration path.
 *
 * @example
 * ```ts
 * import { Arcis, parseUSDC, formatUSDC } from "@arcis/sdk";
 * import { createPublicClient, createWalletClient, http } from "viem";
 * import { base } from "viem/chains";
 * import { privateKeyToAccount } from "viem/accounts";
 *
 * const account = privateKeyToAccount("0x...");
 * const publicClient = createPublicClient({ chain: base, transport: http() });
 * const walletClient = createWalletClient({
 *   chain: base,
 *   transport: http(),
 *   account,
 * });
 *
 * const arcis = new Arcis(publicClient, walletClient);
 *
 * // Deposit
 * const { shares } = await arcis.vault.deposit(parseUSDC("1000"));
 *
 * // Check balance
 * const value = await arcis.vault.balance(account.address);
 * console.log(formatUSDC(value)); // "$1,000.00"
 *
 * // Borrow against position
 * const { loanId } = await arcis.credit.borrow(
 *   parseUSDC("500"),
 *   shares,
 * );
 * ```
 */
export class Arcis {
  public readonly vault: ArcisVault;
  public readonly credit: AgentCredit;
  public readonly bonds?: RevenueBond;
  public readonly config: ArcisConfig;

  constructor(
    publicClient: PublicClient,
    walletClient?: WalletClient,
    config: ArcisConfig = BASE_CONFIG,
  ) {
    this.config = config;
    this.vault = new ArcisVault(config, publicClient, walletClient);
    this.credit = new AgentCredit(config, publicClient, walletClient);

    if (config.addresses.bondFactory) {
      this.bonds = new RevenueBond(
        publicClient,
        config.addresses.bondFactory,
        config.addresses.usdc,
        walletClient,
      );
    }
  }
}
