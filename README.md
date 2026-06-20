<p align="center">
  <br />
  <strong>@arcisprotocol/sdk</strong>
  <br />
  <em>TypeScript SDK for Arcis Protocol</em>
  <br />
  <br />
  <a href="https://arcis.money">arcis.money</a>
  &nbsp;&middot;&nbsp;
  <a href="https://github.com/Arcis-Protocol/core">Contracts</a>
  &nbsp;&middot;&nbsp;
  <a href="https://github.com/Arcis-Protocol/cli">CLI</a>
  &nbsp;&middot;&nbsp;
  <a href="https://github.com/Arcis-Protocol/docs">Docs</a>
</p>

---

Deposit, withdraw, borrow, and manage agent capital in three function calls.

Built on [viem](https://viem.sh). Works with any EVM wallet, agent framework, or backend service.

## Install

```bash
npm install @arcisprotocol/sdk viem
```

## Quick Start

```typescript
import { Arcis, parseUSDC, formatUSDC } from "@arcisprotocol/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Create viem clients
const account = privateKeyToAccount("0x...");
const publicClient = createPublicClient({ chain: base, transport: http() });
const walletClient = createWalletClient({
  chain: base,
  transport: http(),
  account,
});

// Initialize Arcis
const arcis = new Arcis(publicClient, walletClient);

// Deposit 1,000 USDC
const { shares } = await arcis.vault.deposit(parseUSDC("1000"));

// Check position value
const value = await arcis.vault.balance(account.address);
console.log(formatUSDC(value)); // "$1,000.00"

// Withdraw everything
await arcis.vault.withdraw(shares);
```

## Agent Integration

Arcis is designed for autonomous agents. No UI required. Here is the minimal integration for any agent framework.

```typescript
import { ArcisVault, BASE_CONFIG, parseUSDC } from "@arcisprotocol/sdk";

// Your agent's viem clients (already configured)
const vault = new ArcisVault(BASE_CONFIG, publicClient, walletClient);

// The ATI: three functions, one interface
await vault.deposit(parseUSDC("5000"));           // deposit USDC -> raUSDC
const value = await vault.balance(agentAddress);   // check position
await vault.withdraw(shares);                      // redeem raUSDC -> USDC
```

## API Reference

### `Arcis`

Unified client wrapping vault and credit modules.

```typescript
const arcis = new Arcis(publicClient, walletClient?, config?);

arcis.vault   // ArcisVault instance
arcis.credit  // AgentCredit instance
arcis.bonds   // RevenueBond instance (when bondFactory configured)
```

### `ArcisVault`

Core vault operations following the ATI standard.

| Method | Description | Returns |
|---|---|---|
| `deposit(amount)` | Deposit USDC, receive raUSDC | `{ txHash, shares, amount }` |
| `withdraw(shares)` | Redeem raUSDC for USDC | `{ txHash, amount, shares }` |
| `balance(agent)` | USDC value of position | `bigint` |
| `position(agent)` | Full position details | `VaultPosition` |
| `state()` | Current vault state | `VaultState` |
| `previewDeposit(amount)` | Preview shares for deposit | `bigint` |
| `previewWithdraw(shares)` | Preview USDC for withdrawal | `bigint` |
| `exchangeRate()` | Current raUSDC/USDC rate | `bigint` |
| `ensureApproval(amount)` | Auto-approve USDC if needed | `Hash \| null` |
| `usdcBalance(address)` | USDC balance of address | `bigint` |

### `AgentCredit`

Identity-aware lending against raUSDC collateral.

| Method | Description | Returns |
|---|---|---|
| `borrow(amount, collateral)` | Borrow USDC with raUSDC collateral | `{ txHash, loanId }` |
| `repay(loanId)` | Repay loan, unlock collateral | `Hash` |
| `liquidate(loanId)` | Liquidate unhealthy loan | `Hash` |
| `collateralRatio(agent)` | Required ratio for agent (bps) | `bigint` |
| `loanHealth(loanId)` | Check loan health factor | `LoanHealth` |
| `totalOwed(loanId)` | Total debt on loan | `bigint` |
| `getLoan(loanId)` | Full loan details | `Loan` |
| `lendingPool()` | Available capital to borrow | `bigint` |

### `RevenueBond`

Phase 3 — agents issue bonds, humans buy yield.

| Method | Description | Returns |
|---|---|---|
| `issueBond(source, principal, couponBps, duration)` | Issue a new revenue bond | `{ txHash, bondId }` |
| `purchase(bondId, amount)` | Buy bond tokens with USDC | `{ txHash, tokens }` |
| `claimCoupon(bondId)` | Claim accrued coupon | `{ txHash, payout }` |
| `redeem(bondId)` | Redeem principal at maturity | `{ txHash, principal }` |
| `serviceDebt(bondId)` | Service debt from escrow | `Hash` |
| `getBond(bondId)` | Bond details | `Bond` |
| `holderPosition(bondId, holder)` | Holder's bond position | `BondPosition` |
| `escrowBalance(bondId)` | Revenue in escrow | `bigint` |
| `bondCount()` | Total bonds issued | `bigint` |

### Utilities

```typescript
import {
  parseUSDC,            // "100.50" -> 100_500_000n
  formatUSDC,           // 100_500_000n -> "$100.50"
  formatBps,            // 450n -> "4.50%"
  formatCollateralRatio,// 15000n -> "150%"
  formatHealthFactor,   // 1.5e18 -> "1.50"
  formatExchangeRate,   // 1.05e18 -> "1.0500"
} from "@arcisprotocol/sdk";
```

### Constants

```typescript
import {
  BASE_CONFIG,              // Default Base mainnet config
  BASE_ADDRESSES,           // Contract addresses on Base
  USDC_DECIMALS,            // 6
  WAD,                      // 1e18
  BPS_DENOMINATOR,          // 10_000
  TIER_LABELS,              // ["No Identity", "Novice", ...]
  DEFAULT_COLLATERAL_RATIOS,// [20000n, 17500n, ...]
} from "@arcisprotocol/sdk";
```

### ABIs

```typescript
import { arcisVaultAbi, agentCreditAbi, revenueBondFactoryAbi, erc20Abi } from "@arcisprotocol/sdk/abi";
```

## Examples

### Read-only (no wallet needed)

```typescript
const vault = new ArcisVault(BASE_CONFIG, publicClient);

const state = await vault.state();
console.log(`TVL: ${formatUSDC(state.totalAssets)}`);
console.log(`Exchange rate: ${formatExchangeRate(state.exchangeRate)}`);
console.log(`Capacity: ${formatUSDC(state.remainingCapacity)}`);
```

### Borrow against vault position

```typescript
const arcis = new Arcis(publicClient, walletClient);

// Check collateral requirements
const ratio = await arcis.credit.collateralRatio(agent);
console.log(`Required: ${formatCollateralRatio(ratio)}`);

// Borrow 5000 USDC using raUSDC as collateral
const { loanId } = await arcis.credit.borrow(
  parseUSDC("5000"),
  myRaUSDCShares,
);

// Monitor health
const { healthy, healthFactor } = await arcis.credit.loanHealth(loanId);
console.log(`Health: ${formatHealthFactor(healthFactor)}`);
```

### Custom config

```typescript
const customConfig = {
  chainId: 8453,
  addresses: {
    vault: "0x...",
    credit: "0x...",
    router: "0x...",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

const arcis = new Arcis(publicClient, walletClient, customConfig);
```

## Build

```bash
npm install
npm run build    # Build with tsup
npm test         # Run vitest
npm run lint     # Type check
```

## Related Repos

| Repo | Description |
|---|---|
| [`core`](https://github.com/Arcis-Protocol/core) | Smart contracts — Foundry, 24 contracts, 116 tests |
| [`mcp`](https://github.com/Arcis-Protocol/mcp) | MCP Server — connect any AI agent in one tool call |
| [`cli`](https://github.com/Arcis-Protocol/cli) | Terminal interface — TUI for vault operations |
| [`app`](https://github.com/Arcis-Protocol/app) | Landing page + dashboard — [arcis.money](https://arcis.money) |
| [`docs`](https://github.com/Arcis-Protocol/docs) | Protocol docs, ATI spec, integration guides |
| [`monitor`](https://github.com/Arcis-Protocol/monitor) | On-chain monitoring + Telegram alerts |
| [`custos`](https://github.com/Arcis-Protocol/custos) | CUSTOS — autonomous keeper agent |

---

<p align="center">
  <em>ARCIS · MMXXVI</em>
</p>
