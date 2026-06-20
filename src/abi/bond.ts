export const revenueBondFactoryAbi = [
  // ── Read ──
  {
    name: "bondCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getBond",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "agent", type: "address" },
          { name: "revenueSource", type: "address" },
          { name: "principal", type: "uint256" },
          { name: "filled", type: "uint256" },
          { name: "couponBps", type: "uint256" },
          { name: "maturityBlock", type: "uint256" },
          { name: "issuedBlock", type: "uint256" },
          { name: "totalCouponPaid", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "holderBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "bondId", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "claimableCoupon",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "bondId", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "escrowBalances",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalRevenueAccumulated",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "bondSupply",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "minIssuerScore",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "originationFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  // ── Write ──
  {
    name: "issueBond",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "revenueSource", type: "address" },
      { name: "principal", type: "uint256" },
      { name: "couponBps", type: "uint256" },
      { name: "durationBlocks", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "purchase",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bondId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "claimCoupon",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "redeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "serviceDebt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "depositPrincipal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bondId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  // ── Events ──
  {
    name: "BondIssued",
    type: "event",
    inputs: [
      { name: "bondId", type: "uint256", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "principal", type: "uint256", indexed: false },
      { name: "couponBps", type: "uint256", indexed: false },
    ],
  },
  {
    name: "BondPurchased",
    type: "event",
    inputs: [
      { name: "bondId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "CouponPaid",
    type: "event",
    inputs: [
      { name: "bondId", type: "uint256", indexed: true },
      { name: "totalPaid", type: "uint256", indexed: false },
    ],
  },
  {
    name: "BondMatured",
    type: "event",
    inputs: [{ name: "bondId", type: "uint256", indexed: true }],
  },
  {
    name: "BondDefaulted",
    type: "event",
    inputs: [{ name: "bondId", type: "uint256", indexed: true }],
  },
] as const;
