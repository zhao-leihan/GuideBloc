# Explomate Platform - Financial & Gas Fee Report

This report provides a detailed breakdown of transaction volumes, platform revenue splits, and smart contract **gas fee estimates** on the **Base Layer-2 Network** for the Explomate Escrow system.

---

## 1. Platform Financial Overview (Current Database State)

Based on real-time database queries on local production data:

| Metric | Recorded Value | Notes |
| :--- | :--- | :--- |
| **Total Bookings** | `1` | Total booking transactions in database |
| **Completed Trips** | `1` | Successfully fulfilled & funds released |
| **Total Escrow Volume** | `$55.56 USD` | Total stablecoin value deposited |
| **Platform Commission Rate** | `10.0%` | Protocol fee deducted upon payout |
| **Total Platform Income** | `$5.56 USD` | Total fee retained by contract |
| **Total Guide Payouts** | `$50.00 USD` | 90% direct payout split to local guide |

---

## 2. Base Network Gas Fee Cost Analysis

Explomate operates on the **Base Network** (Ethereum Layer 2), which utilizes **EIP-4844 Blob Transactions** to provide ultra-low gas fees.

### On-Chain Gas Fee Breakdown Table

*(Calculated at standard Base Network gas price of ~0.05 Gwei and ETH price of $3,000 USD)*

| Smart Contract Action | Est. Gas Limit | Gas Cost (ETH) | Est. Cost (USD) | Paid By |
| :--- | :--- | :--- | :--- | :--- |
| **1. Factory / Escrow Deployment** | `1,500,000` | `0.0000750 ETH` | **~$0.2250** | Platform (One-time) |
| **2. Tourist Escrow Deposit (USDC/USDT)** | `65,000` | `0.00000325 ETH` | **~$0.0098** | Tourist (at checkout) |
| **3. Payout Release (Atomic 90/10 Split)** | `120,000` | `0.00000600 ETH` | **~$0.0180** | Smart Contract / Auto |
| **4. Tourist Cancellation & Escrow Refund** | `45,000` | `0.00000225 ETH` | **~$0.0068** | Tourist / System |
| **5. Dispute Freeze & Admin Arbitration** | `75,000` | `0.00000375 ETH` | **~$0.0113** | Admin Multisig |

> [!TIP]
> **Key Takeaway**: Because Base is a Layer-2 EVM rollup, the average gas fee per booking transaction is **under 1 cent ($0.01 USD)**, making micro-transactions and small group tour payouts highly cost-effective compared to traditional credit card processing fees (which range from 2.9% + $0.30 per transaction).

---

## 3. Treasury Split Breakdown

When a tourist completes a booking ($55.56 USD total):

```
Tourist Booking Payment ($55.56 USDC)
  └── Explomate Smart Contract Escrow
        ├── 90% ($50.00 USDC) ──> Local Guide EVM Wallet
        └── 10% Platform Fee ($5.56 USDC) ──> Treasury Splitter
              ├── 10% of Fee ($0.56) ──> Gas & Ops Vault
              ├── 50% of Fee ($2.78) ──> SaaS Growth Vault
              └── 40% of Fee ($2.22) ──> Holding Dividends Vault
```

1. **Guide Direct Payout (90%)**: `$50.00 USDC` transferred directly to guide's EVM wallet upon trip completion.
2. **Gas & Ops Vault (10% of fee)**: `$0.56 USDC` reserved to sponsor future transaction gas fees.
3. **SaaS Growth Vault (50% of fee)**: `$2.78 USDC` allocated for platform marketing & development.
4. **Holding Dividends Vault (40% of fee)**: `$2.22 USDC` allocated for platform staking & dividend pools.
