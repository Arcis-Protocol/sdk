# @arcisprotocol/sdk

TypeScript SDK for Arcis Protocol. Vault deposits, credit operations, bond management, event parsing.

## Install

```bash
npm install @arcisprotocol/sdk viem
```

## Quick Start

```typescript
import { Arcis, parseUSDC } from "@arcisprotocol/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const walletClient = createWalletClient({ chain: baseSepolia, transport: http(), account });

const arcis = new Arcis(publicClient, walletClient);

// Deposit USDC
const shares = await arcis.vault.deposit(parseUSDC("1000"));

// Check position
const value = await arcis.vault.balance(agentAddress);

// Withdraw
const amount = await arcis.vault.withdraw(shares);
```

## Modules

### Vault

```typescript
arcis.vault.deposit(amount)           // Deposit USDC → raUSDC
arcis.vault.withdraw(shares)          // Redeem raUSDC → USDC
arcis.vault.emergencyWithdraw(shares) // Withdraw even when paused
arcis.vault.balance(agent)            // Position value in USDC
arcis.vault.totalAssets()             // Vault TVL
arcis.vault.exchangeRate()            // USDC per raUSDC
arcis.vault.maxDeposit(agent)         // Per-agent remaining capacity
arcis.vault.convertToShares(assets)   // ERC-4626 conversion
arcis.vault.convertToAssets(shares)   // ERC-4626 conversion
```

### Credit

```typescript
arcis.credit.borrow(amount, collateral) // Take a credit line
arcis.credit.repay(loanId)              // Repay with interest
arcis.credit.totalOwed(loanId)          // Current debt
arcis.credit.getEffectiveRate(agent)    // Utilization-based rate
arcis.credit.lendingPool()              // Available capital
arcis.credit.totalBorrowed()            // Outstanding loans
```

### Bonds

```typescript
arcis.bonds.issue(params)          // Issue a revenue bond
arcis.bonds.purchase(bondId, amt)  // Buy bond tokens
arcis.bonds.claimCoupon(bondId)    // Claim coupon payment
arcis.bonds.redeem(bondId)         // Redeem at maturity
arcis.bonds.serviceDebt(bondId)    // Service bond obligations
```

## Contract Addresses (Base Mainnet)

| Contract | Address |
|---|---|
| ArcisVault | `0x00325d9da832b38179ed2f0dabd4062d93e325a7` |
| ATIRouter | `0xeC3b7Daa942C03651D55A4A01797498fA6dB728F` |
| StrategyAave | `0x43626D6162Ccb12328B989BB228DaD2941F2F12a` |

## Related Repos

| Repo | Description |
|---|---|
| [`core`](https://github.com/Arcis-Protocol/core) | Smart contracts — 17 contracts, 116 tests |
| [`mcp`](https://github.com/Arcis-Protocol/mcp) | MCP server for AI agents |
| [`custos`](https://github.com/Arcis-Protocol/custos) | CUSTOS — autonomous keeper agent |
| [`docs`](https://github.com/Arcis-Protocol/docs) | ATI v1.1, integration guide, SDK examples |

---

*ARCIS · @arcisprotocol/sdk · MMXXVI*
