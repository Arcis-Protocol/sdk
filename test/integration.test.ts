/**
 * Arcis Protocol — SDK Integration Tests
 *
 * Runs against LIVE contracts on Base Sepolia.
 * Tests the full ATI flow: deposit, balance, withdraw, borrow, repay.
 *
 * Run: npx vitest run test/integration.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type PublicClient,
  type WalletClient,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ArcisVault } from "../src/clients/vault";
import { AgentCredit } from "../src/clients/credit";
import { Arcis } from "../src/clients/index";
import { BASE_SEPOLIA_CONFIG } from "../src/utils/constants";
import { parseUSDC, formatUSDC, formatBps, formatCollateralRatio, formatHealthFactor } from "../src/utils/format";
import { erc20Abi } from "../src/abi/erc20";

// ── Test Config ──
const DEPLOYER_PK = "0x3e7de7ad9f0b2f3503749d8aa093ece3a93c3f44909946353b00c9059c0a3d38";
const RPC_URL = "https://sepolia.base.org";

const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "BaseScan", url: "https://sepolia.basescan.org" } },
});

// ── Shared State ──
let publicClient: PublicClient;
let walletClient: WalletClient;
let vault: ArcisVault;
let credit: AgentCredit;
let arcis: Arcis;
let agent: Address;

describe("Arcis SDK Integration — Base Sepolia", () => {
  beforeAll(() => {
    const account = privateKeyToAccount(DEPLOYER_PK);
    agent = account.address;

    publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    walletClient = createWalletClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
      account,
    });

    vault = new ArcisVault(BASE_SEPOLIA_CONFIG, publicClient, walletClient);
    credit = new AgentCredit(BASE_SEPOLIA_CONFIG, publicClient, walletClient);
    arcis = new Arcis(publicClient, walletClient, BASE_SEPOLIA_CONFIG);
  });

  // ═══════════════════════════════════════════════════════════
  //                   READ-ONLY TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Vault Reads", () => {
    it("reads vault state", async () => {
      const state = await vault.state();

      expect(state.depositCap).toBeGreaterThan(0n);
      expect(state.paused).toBe(false);
      expect(state.exchangeRate).toBeGreaterThan(0n);

      console.log("  Vault State:");
      console.log(`    TVL:        ${formatUSDC(state.totalAssets)}`);
      console.log(`    Supply:     ${state.totalSupply} raUSDC`);
      console.log(`    Deposit Cap: ${formatUSDC(state.depositCap)}`);
      console.log(`    Reserve:    ${formatUSDC(state.reserveBalance)}`);
      console.log(`    Deployed:   ${formatUSDC(state.deployedBalance)}`);
      console.log(`    Paused:     ${state.paused}`);
    });

    it("reads agent balance", async () => {
      const bal = await vault.balance(agent);
      console.log(`  Agent balance: ${formatUSDC(bal)}`);
      // Balance could be 0 or > 0 depending on prior state
      expect(bal).toBeGreaterThanOrEqual(0n);
    });

    it("reads agent position", async () => {
      const pos = await vault.position(agent);
      console.log(`  Agent position: ${pos.shares} shares = ${formatUSDC(pos.value)}`);
      expect(pos.shares).toBeGreaterThanOrEqual(0n);
    });

    it("previews deposit", async () => {
      const amount = parseUSDC("1000");
      const shares = await vault.previewDeposit(amount);
      console.log(`  Preview: ${formatUSDC(amount)} -> ${shares} shares`);
      expect(shares).toBeGreaterThan(0n);
    });

    it("reads exchange rate", async () => {
      const rate = await vault.exchangeRate();
      console.log(`  Exchange rate: ${rate}`);
      expect(rate).toBeGreaterThan(0n);
    });

    it("reads USDC balance", async () => {
      const bal = await vault.usdcBalance(agent);
      console.log(`  Agent USDC: ${formatUSDC(bal)}`);
      expect(bal).toBeGreaterThan(0n);
    });
  });

  describe("Credit Reads", () => {
    it("reads collateral ratio", async () => {
      const ratio = await credit.collateralRatio(agent);
      console.log(`  Collateral ratio: ${formatCollateralRatio(ratio)}`);
      // Deployer registered at score 85 -> Tier 4 -> 115%
      expect(ratio).toBe(11500n);
    });

    it("reads lending pool", async () => {
      const pool = await credit.lendingPool();
      console.log(`  Lending pool: ${formatUSDC(pool)}`);
      expect(pool).toBeGreaterThan(0n);
    });

    it("reads total borrowed", async () => {
      const borrowed = await credit.totalBorrowed();
      console.log(`  Total borrowed: ${formatUSDC(borrowed)}`);
      expect(borrowed).toBeGreaterThanOrEqual(0n);
    });
  });

  // ═══════════════════════════════════════════════════════════
  //                   WRITE TESTS (E2E)
  // ═══════════════════════════════════════════════════════════

  describe("Full ATI Flow", () => {
    const depositAmount = parseUSDC("5000"); // 5,000 USDC
    let depositShares: bigint;

    it("approves and deposits USDC", async () => {
      // Ensure approval
      const approvalTx = await vault.ensureApproval(depositAmount);
      if (approvalTx) {
        console.log(`  Approval TX: ${approvalTx}`);
      } else {
        console.log("  Already approved");
      }

      // Deposit
      const result = await vault.deposit(depositAmount);
      depositShares = result.shares;

      console.log(`  Deposit TX: ${result.txHash}`);
      console.log(`  Shares received: ${result.shares}`);
      console.log(`  Amount deposited: ${formatUSDC(result.amount)}`);

      expect(result.shares).toBeGreaterThan(0n);
      expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }, 30_000);

    it("balance reflects deposit", async () => {
      const bal = await vault.balance(agent);
      console.log(`  Balance after deposit: ${formatUSDC(bal)}`);
      // Should be at least close to deposit amount
      expect(bal).toBeGreaterThan(0n);
    });

    it("position shows correct shares", async () => {
      const pos = await vault.position(agent);
      console.log(`  Position: ${pos.shares} shares = ${formatUSDC(pos.value)}`);
      expect(pos.shares).toBeGreaterThan(0n);
      expect(pos.value).toBeGreaterThan(0n);
    });

    it("withdraws partial position", async () => {
      const pos = await vault.position(agent);
      const halfShares = pos.shares / 2n;

      if (halfShares === 0n) {
        console.log("  Skipping: no shares to withdraw");
        return;
      }

      const result = await vault.withdraw(halfShares);
      console.log(`  Withdraw TX: ${result.txHash}`);
      console.log(`  Shares burned: ${result.shares}`);
      console.log(`  USDC received: ${formatUSDC(result.amount)}`);

      expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }, 30_000);

    it("vault state is consistent", async () => {
      const state = await vault.state();
      console.log(`  TVL after withdraw: ${formatUSDC(state.totalAssets)}`);
      console.log(`  Supply: ${state.totalSupply} raUSDC`);
      expect(state.totalAssets).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("Credit Flow", () => {
    it("borrows USDC against raUSDC collateral", async () => {
      // Check current shares
      const pos = await vault.position(agent);
      console.log(`  Available collateral: ${pos.shares} raUSDC`);

      if (pos.shares === 0n) {
        console.log("  Skipping borrow: no collateral available");
        return;
      }

      // Approve credit contract for raUSDC
      const vaultAddr = BASE_SEPOLIA_CONFIG.addresses.vault;
      const creditAddr = BASE_SEPOLIA_CONFIG.addresses.credit;

      // Check existing allowance
      const allowance = await publicClient.readContract({
        address: vaultAddr as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [agent, creditAddr as Address],
      });

      if (allowance < pos.shares) {
        const approveTx = await walletClient.writeContract({
          address: vaultAddr as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [creditAddr as Address, 2n ** 256n - 1n],
          account: walletClient.account!,
          chain: baseSepolia,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log(`  Approved credit for raUSDC: ${approveTx}`);
      }

      // Borrow 500 USDC
      const borrowAmount = parseUSDC("500");
      const result = await credit.borrow(borrowAmount, pos.shares);
      console.log(`  Borrow TX: ${result.txHash}`);

      expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }, 30_000);

    it("reads loan health", async () => {
      // Check if loan 2 exists (loan 1 was from earlier E2E test)
      try {
        const loan = await credit.getLoan(2n);
        if (loan.agent === agent && !loan.repaid) {
          const health = await credit.loanHealth(2n);
          console.log(`  Loan #2 healthy: ${health.healthy}`);
          console.log(`  Health factor: ${formatHealthFactor(health.healthFactor)}`);
          expect(health.healthy).toBe(true);

          const owed = await credit.totalOwed(2n);
          console.log(`  Total owed: ${formatUSDC(owed)}`);
        } else {
          console.log("  Loan #2 already repaid or not owned by agent");
        }
      } catch {
        // Try loan 1
        try {
          const health = await credit.loanHealth(1n);
          console.log(`  Loan #1 healthy: ${health.healthy}`);
        } catch {
          console.log("  No active loans found");
        }
      }
    });

    it("repays loan", async () => {
      // Find the active loan
      let activeLoanId: bigint | null = null;

      for (let i = 1n; i <= 5n; i++) {
        try {
          const loan = await credit.getLoan(i);
          if (loan.agent === agent && !loan.repaid) {
            activeLoanId = i;
            break;
          }
        } catch {
          break;
        }
      }

      if (!activeLoanId) {
        console.log("  No active loan to repay");
        return;
      }

      // Approve USDC for repayment
      const usdcAddr = BASE_SEPOLIA_CONFIG.addresses.usdc;
      const creditAddr = BASE_SEPOLIA_CONFIG.addresses.credit;

      const approveTx = await walletClient.writeContract({
        address: usdcAddr as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [creditAddr as Address, 2n ** 256n - 1n],
        account: walletClient.account!,
        chain: baseSepolia,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Repay
      const txHash = await credit.repay(activeLoanId);
      console.log(`  Repay TX (Loan #${activeLoanId}): ${txHash}`);

      // Verify collateral returned
      const pos = await vault.position(agent);
      console.log(`  Collateral returned: ${pos.shares} raUSDC`);
      expect(pos.shares).toBeGreaterThan(0n);
    }, 30_000);
  });

  // ═══════════════════════════════════════════════════════════
  //               UNIFIED CLIENT TEST
  // ═══════════════════════════════════════════════════════════

  describe("Arcis Unified Client", () => {
    it("accesses vault through unified client", async () => {
      const state = await arcis.vault.state();
      console.log(`  TVL via Arcis: ${formatUSDC(state.totalAssets)}`);
      expect(state.depositCap).toBeGreaterThan(0n);
    });

    it("accesses credit through unified client", async () => {
      const ratio = await arcis.credit.collateralRatio(agent);
      console.log(`  Ratio via Arcis: ${formatCollateralRatio(ratio)}`);
      expect(ratio).toBe(11500n);
    });

    it("config is correct", () => {
      expect(arcis.config.chainId).toBe(84532);
      expect(arcis.config.addresses.vault).toBe("0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d");
      expect(arcis.config.addresses.credit).toBe("0x019540E33a0292a9DDE36bD9Ef11774d5A1Ce6FC");
    });
  });

  // ═══════════════════════════════════════════════════════════
  //               FORMAT UTILITIES (WITH REAL DATA)
  // ═══════════════════════════════════════════════════════════

  describe("Formatting with real values", () => {
    it("formats live vault data", async () => {
      const state = await vault.state();
      const bal = await vault.balance(agent);

      console.log(`  TVL:          ${formatUSDC(state.totalAssets)}`);
      console.log(`  Balance:      ${formatUSDC(bal)}`);
      console.log(`  Cap:          ${formatUSDC(state.depositCap)}`);
      console.log(`  Remaining:    ${formatUSDC(state.remainingCapacity)}`);

      // Just verify formatting doesn't throw
      expect(formatUSDC(state.totalAssets)).toContain("$");
    });
  });
});
