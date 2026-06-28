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
import { baseMainnet } from "viem/chains";

const publicClient = createPublicClient({ chain: baseMainnet, transport: http() });
const walletClient = createWalletClient({ chain: baseMainnet, transport: http(), account });

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
| ATIRouter | `0xd0c64f997ca9aa427f8834578bd7f0313f868e83` |
| StrategyAave | `0x43626D6162Ccb12328B989BB228DaD2941F2F12a` |
| RevenueBondFactory | `0xeb65d8bb08e0ea4a6bb9162d53d1b444f99681ba` |
| IdentityRegistry | `0xaa4da295dd368c0f10128654af76e3f002e20e71` |

## Related Repos

| Repo | Description |
|---|---|
| [`core`](https://github.com/Arcis-Protocol/core) | Smart contracts — 17 contracts, 116 tests |
| [`mcp`](https://github.com/Arcis-Protocol/mcp) | MCP server for AI agents |
| [`custos`](https://github.com/Arcis-Protocol/custos) | CUSTOS — autonomous keeper agent |
| [`docs`](https://github.com/Arcis-Protocol/docs) | ATI v1.1, integration guide, SDK examples |

---

*ARCIS · @arcisprotocol/sdk · MMXXVI*
