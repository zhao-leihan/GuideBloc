<div align="center">

  <img src="https://www.explomate.com/assets/navbaronly.png" alt="Explomate Logo" width="220" />

  # 🌍 Explomate.ly
  ### Decentralized Web3 Travel Marketplace & Local Guide Network

  [![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
  [![Network](https://img.shields.io/badge/Chain-Avalanche%20C--Chain-E84142?style=for-the-badge&logo=avalanche)](https://avax.network)
  [![Database](https://img.shields.io/badge/Database-Neon%20Cloud%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech)
  [![License](https://img.shields.io/badge/License-Proprietary%20All%20Rights%20Reserved-blue?style=for-the-badge)](#-license)

  <p align="center">
    <img src="https://cryptologos.cc/logos/avalanche-avax-logo.png" width="26" height="26" alt="Avalanche" />
    &nbsp;&nbsp;&nbsp;&nbsp;
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circle_USDC_Logo.svg/1280px-Circle_USDC_Logo.svg.png" width="26" height="26" alt="USDC" />
  </p>

</div>

---

## 📖 Overview

**Explomate.ly** is a state-of-the-art Web3 decentralized travel marketplace (DApp) that connects global travelers (*Tourists*) with verified local insiders (*Tour Guides*). Powered by smart escrow contracts on **Avalanche C-Chain** and **Base L2**, Explomate eliminates middleman fees, ensures zero-trust payment safety, and delivers an immersive, gamified travel experience worldwide.

---

## ⚡ Core Platform Features

### 🛡️ 1. Multi-Chain Smart Escrow Protection
- **Zero-Trust Settlement**: Traveler payments in **USDC/USDT** are securely locked in immutable smart escrow contracts on **Avalanche C-Chain** and **Base L2**.
- **Automated Payout Release**: Funds are safely transferred to the Tour Guide's wallet only after the traveler confirms successful tour completion.
- **Payout Wallet Enforcement**: Guides must link an EVM-compatible payout wallet before publishing any tour offer.

### 📡 2. Real-Time GPS Meetup Radar & Haversine Engine
- **Live Proximity Tracking**: Real-time GPS coordinate calculation using the Haversine formula to detect when Tourist & Guide are within 50 meters of the meeting point.
- **Double Selfie Biometric Verification**: Both parties upload facial verification selfies to ensure maximum safety before releasing escrow funds.

### 🎮 3. Gamification & Leaderboard (XP & Leveling System)
- **Dynamic XP Earned**: Guides earn +10 XP per USD on every completed tour.
- **Dynamic Leveling**: Automatic level-ups for every 1,000 XP, boosting search visibility algorithms.
- **Global Leaderboard & System Mailbox**: Live interactive rankings and automated reward inbox.

### 📈 4. Algorithmic Boost Engine
- Guides can boost their tour listing to top search results for 7 days by paying a 1 USDC Web3 network fee directly via smart contract.

### 🎨 5. Dynamic Dual-Theme System (Light & Dark Mode)
- Built with a dynamic state observer (`MutationObserver`) supporting instant theme toggling between clean Soft Pastel Blue (`#e8effe`) in Light Mode and luxury Dark Slate Navy (`#1e293b`) in Dark Mode.

### 🔒 6. Tour Guide View-Only Mode
- Prevents Tour Guides from self-booking their own gigs or booking other tours, enforcing strict view-only permissions for guide accounts.

---

## 📜 Deployed Smart Contracts

| Network | Network Type | Contract Address | Chain ID |
| :--- | :--- | :--- | :--- |
| 🔺 **Avalanche C-Chain** | **Mainnet** | [`0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8`](https://snowtrace.io/address/0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8) | `43114` |
| 🔵 **Base L2** | **Mainnet** | [`0x8A74C711B3207611C76b4d6d305C930BE8326902`](https://basescan.org/address/0x8A74C711B3207611C76b4d6d305C930BE8326902) | `8453` |
| 🔺 **Avalanche Fuji** | **Testnet** | [`0x8A74C711B3207611C76b4d6d305C930BE8326902`](https://testnet.snowtrace.io/address/0x8A74C711B3207611C76b4d6d305C930BE8326902) | `43113` |

---

## 🛠️ Technology Stack

- **Frontend & App Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling & Icons**: Vanilla CSS / Tailwind CSS, Lucide React Icons
- **Database & ORM**: PostgreSQL (Neon Cloud DB), Prisma ORM
- **Smart Contracts & Web3**: Solidity 0.8.20, Hardhat, Ethers.js v6
- **Authentication**: NextAuth.js (Google OAuth & Credentials Provider)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/zhao-leihan/explomate.git
cd explomate
npm install
```

### 2. Environment Configuration (`.env`)
Copy `.env.example` to `.env` and fill in your database and Web3 configurations:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-sweet-bar.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_ESCROW_ADDRESS="0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8"
```

### 3. Database Migration & Seeding
```bash
npx prisma db push
npx ts-node scripts/seed-neon-db.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 License

### Proprietary Commercial License (All Rights Reserved)
This repository and its source code are strictly proprietary. Unauthorized copying, distribution, modification, or commercial exploitation of this repository without explicit written consent from the copyright holder is strictly prohibited. Refer to the [LICENSE](LICENSE) file for complete details.

---

<div align="center">
  <sub>Built with ❤️ by the Explomate Team</sub>
</div>
