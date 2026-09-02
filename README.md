<div align="center">

  <img src="https://www.explomate.com/assets/navbaronly.png" alt="Explomate Logo" width="220" />

  # Explomate
  ### Decentralized P2P travel gig marketplace built on Avalanche C-Chain for local guide escrow bookings

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

**Explomate.ly** is a state-of-the-art Web3 decentralized travel marketplace (DApp) connecting global travelers (*Tourists*) with verified local insiders (*Tour Guides*). Powered by pure Web3 smart escrow contracts on **Avalanche C-Chain**, Explomate eliminates middleman lockups, ensures zero-trust payment safety, guarantees 100% net earnings for tour guides, and delivers an immersive, gamified travel experience worldwide.

---

## ⚡ Core Platform Features

### 🛡️ 1. Pure Web3 Escrow V2 (Serverless & Bot-Proof)
- **Zero-Trust Settlement**: Traveler payments in **Native USDC/USDT** are securely locked in immutable smart escrow contracts on **Avalanche C-Chain**.
- **100% Guide Net Guarantee**: A transparent buyer-pays model ensures guides receive exactly 100% of their designated take-home payout upon completion, while tourist checkout seamlessly covers the 10% protocol fee.
- **On-Chain Atomic Distribution**: Upon tour verification, escrow funds are transferred simultaneously and atomically on-chain (90% to the guide's registered wallet + 10% to the protocol treasury).
- **Zero Server Custody**: Completely decentralized settlement without server private key custody.

### 📸 2. Mandatory Proof of Tour Photo Verification
- **Dual Verification Requirement**: Prior to releasing escrow funds, tourists and guides are required to provide verified photographic documentation of the completed experience directly inside the verification modal.
- **Auditable Records**: Cryptographic hashes and proof media links are recorded permanently for audit trail integrity.

### 📡 3. Real-Time GPS Meetup Radar & Haversine Engine
- **Live Proximity Tracking**: Real-time GPS coordinate calculation using the Haversine formula to detect when Tourist & Guide are within 50 meters of the meeting point.
- **Dynamic Booking QR Verification**: Cryptographically signed single-use booking QR codes verify arrival in real-time.

### 🎮 4. Gamification & Leaderboard (XP & Leveling System)
- **Dynamic XP System**: Guides earn +10 XP per USD on every completed tour.
- **Dynamic Leveling**: Automatic level-ups for every 1,000 XP, boosting search visibility algorithms.
- **Global Leaderboard & System Mailbox**: Live interactive rankings, achievement tiers, and notification inbox.

### 📈 5. Fractional Pricing ($0.01 Minimum) & Algorithmic Boost
- **Micro-Experiences**: Supports flexible fractional pricing starting at just $0.01 USDC.
- **Listing Promotion**: Guides can boost their tour listing to top search results for 7 days with on-chain boost activation.

### 🎨 6. Dynamic Dual-Theme System (Light & Dark Mode)
- Built with a dynamic state observer (`MutationObserver`) supporting instant theme toggling between clean Soft Pastel Blue (`#e8effe`) in Light Mode and luxury Dark Slate Navy (`#1e293b`) in Dark Mode.

---

## 📜 Deployed Smart Contracts

| Network | Network Type | Contract Address | Explorer Link | Chain ID |
| :--- | :--- | :--- | :--- | :--- |
| 🔺 **Avalanche C-Chain** | **Mainnet (Active)** | `0x2D4eC9380218C252F9468078b35F90B559331d19` | [SnowTrace Mainnet](https://snowtrace.io/address/0x2D4eC9380218C252F9468078b35F90B559331d19) | `43114` |
| 🔺 **Avalanche Fuji** | **Testnet** | `0xCd934aEBb3f0774a02121fc8AD0741D5073C23F2` | [SnowTrace Fuji](https://testnet.snowtrace.io/address/0xCd934aEBb3f0774a02121fc8AD0741D5073C23F2) | `43113` |

### 🪙 Official Mainnet Token Addresses (Avalanche C-Chain)
- **Circle Native USDC**: [`0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`](https://snowtrace.io/token/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E) (Decimals: 6)
- **Tether USD (USDT)**: [`0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`](https://snowtrace.io/token/0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7) (Decimals: 6)
- **Platform Treasury Address**: `0x079D9c349741C27565ee04e31E4174F640F512aE`

---

## 🛠️ Technology Stack

- **Frontend & App Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling & Animation**: Tailwind CSS, Framer Motion, Lucide React Icons
- **Database & ORM**: PostgreSQL (Neon Cloud DB), Prisma ORM
- **Smart Contracts & Web3**: Solidity 0.8.20, OpenZeppelin, Hardhat, Ethers.js v6
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
NEXT_PUBLIC_ESCROW_ADDRESS="0x2D4eC9380218C252F9468078b35F90B559331d19"
```

### 3. Database Migration & Seeding
```bash
npx prisma db push
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
