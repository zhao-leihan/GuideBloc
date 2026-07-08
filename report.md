# Explomate Platform Technical Audit Report

This report provides a comprehensive technical audit of the Explomate codebase, architecture, components, smart contracts, database structure, security layers, and third-party integrations.

---

## 1. System Architecture & Tech Stack

Explomate is built as a modern, premium, decentralized travel booking and secure escrow platform.

- **Frontend & Routing**: Next.js 14 (App Router) with TypeScript.
- **Styling**: Tailwind CSS with a customized premium dark mode aesthetic (HSL tailored colors, custom card grids, and interactive transitions).
- **Database Layer**: Prisma ORM with PostgreSQL.
- **Authentication**: NextAuth.js (supporting email credentials and Google OAuth provider).
- **Real-Time Communication**: Supabase JS (WebSocket-based messaging channel).
- **Decentralized Escrow**: Hardhat compilation suite, Solidity Smart Contracts, and Ethers.js for Base Network EVM wallet connections.
- **Transactional Delivery**: Resend.com API integration with programmatically generated PDF attachments (`jspdf`).

---

## 2. Core Database Schema (Prisma)

The PostgreSQL database contains the following central models:

### User (`User`)
Tracks registration credentials, roles, profile cards, gamification, and security states:
- `id`, `email`, `name`, `password`, `avatar`, `bio`, `country`, `language`, `createdAt`.
- `role`: Enum (`TOURIST`, `GUIDE`, `ADMIN`).
- `guideStatus`: Enum (`NONE`, `PENDING`, `APPROVED`, `REJECTED`).
- `walletAddress`: Stores connected Web3 EVM addresses for payouts/funding.
- `passportNumber`, `idCardNumber`, `birthDate`, `title`, `age` (for tourist checkouts).
- `xp`, `level`: Guide gamification system.
- `isBlocked`: Flag to immediately lock down compromised accounts.

### Gig (`Gig`)
Tracks tour details created by guides:
- `id`, `title`, `description`, `category`, `location`, `priceUSD`.
- `featured_until`: Subscription boost expiration.
- `ranking_score`, `booking_count`, `avgRating`, `reviewCount`: Guide listing metrics.
- `images` (array), `tags` (array), `languages` (array), `included`/`excluded`/`benefits` (arrays).

### Booking (`Booking`)
Core transaction model tracking payments and trip progress:
- `id`, `bookingDate`, `bookingTime`, `groupSize`, `totalPriceUSD`.
- `status`: Enum (`PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `DISPUTED`).
- `txHash`: The blockchain transaction hash proving escrow deposits.
- `paymentNetwork`: Base/Polygon network designation.

### Supporting Tables
- `GroupMember`: Saved passenger data profiles for tourists.
- `Conversation` & `Message`: Chat rooms and real-time chat histories.
- `Review`: Tour feedback (stars and text).
- `PlatformRevenue`: Financial logs tracking source income type.
- `Mail`: Database-logged internal system notices.
- `Warning`: Moderation notices issued to guides by admins.
- `PasswordResetToken`: Secure temporary reset tokens.

---

## 3. Blockchain Escrow & Treasury splits

The decentralized payment mechanism resides in `contracts/ExplomateEscrow.sol`:

### Smart Contract Mechanics
- **Safe Token Handling**: Utilizes OpenZeppelin `SafeERC20` to prevent token transfer exploits.
- **Reentrancy Protection**: Uses `ReentrancyGuard` to secure payment releases.
- **Escrow Lock**: Tourists deposit stablecoins (USDC/USDT) into the contract upon booking.
- **Payout Release**: Funds are transferred to the guide's wallet only after digital confirmation by the tourist, or after a preset timelock expires without disputes.
- **Dispute Freeze**: If a tourist triggers a dispute, funds are frozen immediately. Only the platform admin's signature can override, arbitrate, and release/refund the assets.

### Atomic Treasury Splitter
The platform charges a **10% commission fee** on successful checkouts. Inside the smart contract, this 10% take-rate is split atomically:
1. **10% to Gas & Ops Vault** (`gasOpsVault`): Co-sponsoring transaction gas.
2. **50% to SaaS Growth Vault** (`saasGrowthVault`): Reinvested in platform expansion.
3. **40% to Holding Dividends Vault** (`holdingDividendsVault`): Distributed to investors/holders.

---

## 4. User Experience & Portals

### Public Pages
- **Home (`/`)**: High-fidelity marketing landing page displaying value propositions, search tools, and featured tours.
- **Explore (`/explore`)**: Listing grid showing search filters, location lookups, and card ratings.
- **About (`/about`)**: Team profiles with optimized responsive sizing cards.
- **How It Works (`/how-it-works`)**: Platform walkthrough instructions.

### Tourist Dashboard
- **My Bookings**: Filterable tab selector separating "Active Bookings" (Pending/Confirmed) from "Booking History" (Completed/Cancelled).
- **Saved Travelers**: Panel to save passport and identification numbers to speed up subsequent checkout flows.
- **Messages**: Direct chat interface with tour guides.
- **Wallet**: Connection screen showing balances.

### Guide Dashboard
- **Overview**: KPIs for Earnings, Pending Release, and Active bookings. Includes a gamification level banner displaying current XP progress.
- **Create Gig**: Rich form supporting photo uploads and pricing configurations.
- **My Gigs**: Overview of all listings with soft-deletion deactivation options.
- **Subscription**: Boost interface to sponsor gigs for search priority.
- **Earnings & Wallet**: Web3 connection setup to receive payouts.

### Super Admin Panel
- **Operational Overview**: Platform KPIs (Revenue, Volume, Escrow, Users) and a read-only Base RPC Exodus Wallet monitor showing current native ETH balances and recent on-chain transfers.
- **User Manager**: Audit tool to search users, review guide applications, and suspend malicious users.
- **Dispute Resolver**: Direct overrides to refund tourists or release disputed escrow funds.

---

## 5. Security & Bot Prevention

- **Brute-Force Shield**: Integrated Cloudflare Turnstile Captcha on both Login and Registration forms.
- **Account Block Lockout**: The backend `NextAuth` sign-in hook queries the database for blocked states. If `isBlocked = true`, authentication is rejected, and all subsequent API endpoints block operations.
- **Anomaly Detection**: An automated backend scanner checks guides receiving consecutive low ratings ($\le 2$ stars) and suspends their accounts to freeze their escrow funds.

---

## 6. Email Notification Architecture (Resend.com)

All email communication is dispatched via the Resend API using verified sender domains, wrapping all bodies inside custom HTML layouts featuring a premium linear gradient header banner (`linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)`).

- **Welcome Onboarding**: Welcome emails tailored to Tourist and Guide roles upon registration.
- **Password Reset**: Dynamic secure link containing a 64-character hash valid for 1 hour.
- **Transaction Receipt**: Once a booking status changes to `CONFIRMED` (escrow funded), a programmatically styled A4 PDF receipt (via `jspdf`) is attached and sent to the tourist.
- **Payout Notification**: Emailed to the tourist/guide when escrow funds are successfully released.
