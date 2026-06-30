# @arcisprotocol/sdk

TypeScript SDK for Arcis Protocol — financial infrastructure for AI agents on Base.

## Install

```bash
npm install @arcisprotocol/sdk viem
```

## Quick Start

```ts
import { ArcisVault, BASE_CONFIG, parseUSDC } from "@arcisprotocol/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");
const pub = createPublicClient({ chain: base, transport: http() });
const wall = createWalletClient({ chain: base, transport: http(), account });

const vault = new ArcisVault(BASE_CONFIG, pub, wall);

// Deposit $100 USDC
await vault.deposit(parseUSDC("100"));

// Check position
const pos = await vault.position(account.address);
console.log(`Value: $${pos.value / 1_000_000n}`);

// Withdraw all
await vault.withdraw(pos.shares);
```

## Idle Capital Manager (x402-aware)

Auto-deposits idle USDC into the vault. Auto-withdraws when the agent needs funds.

```ts
import { IdleCapitalManager, BASE_CONFIG } from "@arcisprotocol/sdk";

const manager = new IdleCapitalManager(BASE_CONFIG, pub, wall, {
  depositThreshold: 100_000_000n, // Deposit when wallet > $100
  reserveMinimum:    20_000_000n, // Keep $20 for gas + payments
  withdrawTrigger:    5_000_000n, // Withdraw when wallet < $5
  intervalMs: 60_000,             // Check every minute
  onDeposit: (amt, shares, tx) => console.log(`Deposited $${amt / 1_000_000n}`),
});

manager.start();
```

Works with x402 payment flows: agent earns USDC → idle capital auto-compounds → withdraws for next payment.

## Clients

| Client | Class | Description |
|---|---|---|
| Vault | `ArcisVault` | deposit, withdraw, balance, position, state |
| Credit | `AgentCredit` | borrow, repay, health, tiers |
| Bonds | `RevenueBond` | issue, purchase, claim, redeem |
| Idle Capital | `IdleCapitalManager` | auto deposit/withdraw on threshold |

## Contracts (Base Mainnet)

| Contract | Address |
|---|---|
| ArcisVault (raUSDC) | `0x00325d9da832b38179ed2f0dabd4062d93e325a7` |
| AgentCredit | `0xdf31800e620f728297340d66acf5a306f07ce7a1` |
| RevenueBondFactory | `0xeb65d8bb08e0ea4a6bb9162d53d1b444f99681ba` |
| IdentityRegistry | `0xaa4da295dd368c0f10128654af76e3f002e20e71` |
| ATIRouter | `0xd0c64f997ca9aa427f8834578bd7f0313f868e83` |
| StrategyAave | `0x43626D6162Ccb12328B989BB228DaD2941F2F12a` |
| StrategyAllocator | `0x7Fd5d7b49694858FCf143E0039e83cDB0196DD7A` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## Links

- [arcis.money](https://arcis.money) · [Dashboard](https://arcis.money/dashboard)
- [DeFiLlama](https://defillama.com/protocol/arcis-protocol)
- [GitHub](https://github.com/Arcis-Protocol)
- [Integration Guide](https://github.com/Arcis-Protocol/docs/blob/main/INTEGRATION.md)

---

*ARCIS · Base Mainnet · MMXXVI*
