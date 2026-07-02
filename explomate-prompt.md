# 🌍 EXPLOMATE — Master Build Prompt
## SaaS Platform: Tourist × Tour Guide Marketplace with Crypto Payments

---

## 🎯 OVERVIEW & VISION

Build **Explomate** — a full-stack SaaS web platform that connects tourists with local tour guides worldwide. Tour guides list their gigs (tour packages), tourists discover and book them, and all payments are settled in cryptocurrency (USDT/USDC on-chain). The brand feel is modern, trustworthy, and adventurous — inspired by the energy of exploration combined with the precision of Web3 finance.

**Tagline:** *"Explore the World. Pay in the Future."*

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: Next.js API Routes + Prisma ORM
- Database: PostgreSQL (via Supabase or Railway)
- Auth: NextAuth.js (email/password + Google OAuth)
- Crypto Payments: ethers.js + WalletConnect + USDT/USDC smart contracts (ERC-20 on Polygon/Base)
- Real-time Chat: Supabase Realtime (WebSocket) or Pusher Channels
- File Storage: Cloudinary (tour photos + chat media)
- Maps: Google Maps API or Mapbox
- Email: Resend or Nodemailer
- Push Notifications: Web Push API (via service worker)
- Deployment: Vercel

---

## 👥 USER ROLES

### 1. Tourist (Buyer)
- Browse and search tour guide gigs
- Book and pay for tours in USDT or USDC
- Leave reviews after the tour
- Manage upcoming and past bookings
- Connect crypto wallet (MetaMask / WalletConnect)
- **Chat with tour guides before and after booking**
- **Receive in-app + push notifications for messages**

### 2. Tour Guide (Seller)
- Create and manage gig listings
- Set pricing in USD (displayed as USDT/USDC equivalent)
- Manage availability calendar
- Accept or decline booking requests
- Receive crypto payments directly to their wallet
- View earnings dashboard
- **Chat with tourists (pre-booking inquiries & post-booking coordination)**
- **Send location pins, documents, and photos via chat**

### 3. Admin (Platform Owner)
- Manage all users, gigs, and bookings
- Set platform commission rate (e.g. 10%)
- View financial analytics
- Handle disputes and support
- **Monitor flagged chat conversations**
- **Join dispute chat threads as mediator**
- **Manage subscription plans and revenue streams**

---

## 🗄️ DATABASE SCHEMA (Prisma)

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String
  password       String?
  role           Role      @default(TOURIST)
  avatar         String?
  walletAddress  String?
  bio            String?
  country        String?
  language       String[]
  createdAt      DateTime  @default(now())
  gigs           Gig[]
  bookings       Booking[]
  reviewsGiven   Review[]  @relation("ReviewGiver")
  reviewsReceived Review[] @relation("ReviewReceiver")
}

enum Role {
  TOURIST
  GUIDE
  ADMIN
}

model Gig {
  id           String    @id @default(cuid())
  title        String
  description  String
  category     String
  location     String
  country      String
  lat          Float?
  lng          Float?
  durationHours Int
  maxGroupSize  Int
  priceUSD     Float
  images       String[]
  tags         String[]
  languages    String[]
  included     String[]
  excluded     String[]
  meetingPoint String?
  isActive     Boolean   @default(true)
  guide        User      @relation(fields: [guideId], references: [id])
  guideId      String
  bookings     Booking[]
  reviews      Review[]
  createdAt    DateTime  @default(now())
}

model Booking {
  id              String        @id @default(cuid())
  gig             Gig           @relation(fields: [gigId], references: [id])
  gigId           String
  tourist         User          @relation(fields: [touristId], references: [id])
  touristId       String
  bookingDate     DateTime
  groupSize       Int
  totalPriceUSD   Float
  totalPriceCrypto Float
  cryptoToken     CryptoToken
  status          BookingStatus @default(PENDING)
  txHash          String?
  paymentNetwork  String?
  specialRequests String?
  createdAt       DateTime      @default(now())
}

enum BookingStatus {
  PENDING
  AWAITING_PAYMENT
  CONFIRMED
  COMPLETED
  CANCELLED
  DISPUTED
}

enum CryptoToken {
  USDT
  USDC
}

model Review {
  id         String   @id @default(cuid())
  gig        Gig      @relation(fields: [gigId], references: [id])
  gigId      String
  booking    Booking  @relation(fields: [bookingId], references: [id])
  bookingId  String   @unique
  reviewer   User     @relation("ReviewGiver", fields: [reviewerId], references: [id])
  reviewerId String
  guide      User     @relation("ReviewReceiver", fields: [guideId], references: [id])
  guideId    String
  rating     Int
  comment    String
  createdAt  DateTime @default(now())
}

model PlatformSettings {
  id             String @id @default("singleton")
  commissionRate Float  @default(0.10)
  supportedChains String[]
}

// ─── CHAT SYSTEM ─────────────────────────────────────────

model Conversation {
  id           String    @id @default(cuid())
  gigId        String?   // optional: tied to a specific gig inquiry
  gig          Gig?      @relation(fields: [gigId], references: [id])
  bookingId    String?   // optional: tied to a confirmed booking
  booking      Booking?  @relation(fields: [bookingId], references: [id])
  touristId    String
  tourist      User      @relation("TouristConversations", fields: [touristId], references: [id])
  guideId      String
  guide        User      @relation("GuideConversations", fields: [guideId], references: [id])
  messages     Message[]
  isArchived   Boolean   @default(false)
  lastMessageAt DateTime?
  createdAt    DateTime  @default(now())
}

model Message {
  id             String       @id @default(cuid())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  sender         User         @relation(fields: [senderId], references: [id])
  senderId       String
  content        String
  type           MessageType  @default(TEXT)
  mediaUrl       String?      // Cloudinary URL for image/file
  isRead         Boolean      @default(false)
  isDeleted      Boolean      @default(false)
  isFlagged      Boolean      @default(false)
  createdAt      DateTime     @default(now())
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  LOCATION
  BOOKING_CARD   // system card: "Booking #XYZ has been confirmed"
  SYSTEM         // automated system messages
}

// ─── MONETIZATION SYSTEM ─────────────────────────────────

model SubscriptionPlan {
  id            String   @id @default(cuid())
  name          String   // "Free", "Explorer", "Pro Guide", "Elite Guide"
  role          Role     // TOURIST or GUIDE
  priceMonthly  Float
  priceYearly   Float
  features      String[]
  maxGigs       Int?     // null = unlimited
  commissionRate Float   // platform cut for this tier
  isFeatured    Boolean  @default(false)
  createdAt     DateTime @default(now())
  subscribers   UserSubscription[]
}

model UserSubscription {
  id              String           @id @default(cuid())
  user            User             @relation(fields: [userId], references: [id])
  userId          String
  plan            SubscriptionPlan @relation(fields: [planId], references: [id])
  planId          String
  billingCycle    BillingCycle     @default(MONTHLY)
  status          SubStatus        @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  txHash          String?          // crypto subscription payment tx
  createdAt       DateTime         @default(now())
}

enum BillingCycle { MONTHLY YEARLY }
enum SubStatus    { ACTIVE CANCELLED EXPIRED PAST_DUE }

model GigBoost {
  id          String   @id @default(cuid())
  gig         Gig      @relation(fields: [gigId], references: [id])
  gigId       String
  guide       User     @relation(fields: [guideId], references: [id])
  guideId     String
  boostType   BoostType
  priceUSDT   Float
  txHash      String
  startsAt    DateTime
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}

enum BoostType {
  FEATURED_HOME    // shown on landing page
  TOP_SEARCH       // pinned at top of search results
  CATEGORY_BANNER  // banner in a category page
}

model PlatformRevenue {
  id          String      @id @default(cuid())
  source      RevenueSource
  amountUSDT  Float
  txHash      String?
  referenceId String?     // bookingId, subscriptionId, or gigBoostId
  createdAt   DateTime    @default(now())
}

enum RevenueSource {
  BOOKING_COMMISSION
  SUBSCRIPTION_FEE
  GIG_BOOST
  FEATURED_LISTING
  TIP_FEE
}
```

---

## 🖥️ PAGES & ROUTES

### Public Pages
| Route | Description |
|---|---|
| `/` | Landing page — hero, how it works, featured gigs, testimonials |
| `/explore` | Search & filter all gigs (location, category, price, rating, language) |
| `/gigs/[id]` | Gig detail page — photos, description, reviews, booking widget |
| `/guides/[id]` | Guide profile page — their gigs, bio, ratings, languages |
| `/about` | About Explomate |
| `/how-it-works` | Step-by-step for tourists and guides |

### Auth Pages
| Route | Description |
|---|---|
| `/auth/login` | Login with email or Google |
| `/auth/register` | Register as Tourist or Tour Guide |
| `/auth/forgot-password` | Password reset |

### Tourist Dashboard (`/dashboard/tourist/`)
| Route | Description |
|---|---|
| `/bookings` | All bookings (upcoming, past, cancelled) |
| `/bookings/[id]` | Booking detail + payment status + leave review |
| `/messages` | Inbox — list of all conversations |
| `/messages/[conversationId]` | Chat window with a guide |
| `/wallet` | Connect wallet, transaction history |
| `/subscription` | View/upgrade subscription plan |
| `/profile` | Edit profile |

### Guide Dashboard (`/dashboard/guide/`)
| Route | Description |
|---|---|
| `/overview` | Earnings summary, upcoming bookings |
| `/gigs` | List of all gigs (active/inactive) |
| `/gigs/create` | Create new gig multi-step form |
| `/gigs/[id]/edit` | Edit existing gig |
| `/gigs/[id]/boost` | Purchase boost/promotion for a gig |
| `/bookings` | Manage incoming booking requests |
| `/bookings/[id]` | Booking detail + accept/decline |
| `/messages` | Inbox — all tourist conversations |
| `/messages/[conversationId]` | Chat window with a tourist |
| `/earnings` | Earnings per booking, withdrawal history |
| `/subscription` | View/upgrade Guide subscription plan |
| `/wallet` | Connect payout wallet address |
| `/profile` | Edit guide profile |

### Admin Panel (`/admin/`)
| Route | Description |
|---|---|
| `/dashboard` | Platform overview stats |
| `/users` | Manage all users |
| `/gigs` | Manage all gigs |
| `/bookings` | All bookings + dispute management |
| `/messages` | Monitor flagged conversations |
| `/revenue` | Full revenue breakdown by source |
| `/subscriptions` | Manage subscription plans & subscribers |
| `/boosts` | Active and past gig boosts |
| `/settings` | Commission rate, supported tokens, networks |

---

## 🎨 DESIGN SYSTEM

### Color Palette
```
Primary:      #0EA5E9  (sky blue — trust + adventure)
Secondary:    #10B981  (emerald — success + crypto)
Accent:       #F59E0B  (amber — energy + warmth)
Dark BG:      #0F172A  (deep navy — premium feel)
Card BG:      #1E293B  (slate)
Light BG:     #F8FAFC  (off-white for light mode)
Text Primary: #FFFFFF / #0F172A
Text Muted:   #94A3B8
Danger:       #EF4444
```

### Typography
```
Display:  'Plus Jakarta Sans' — bold, modern, wide spacing
Body:     'Inter' — clean, readable
Mono:     'JetBrains Mono' — wallet addresses, tx hashes
```

### Brand Elements
- Logo: Compass icon + "Explomate" wordmark
- Gig cards: Rounded corners (12px), subtle shadow, image-first layout
- Crypto badges: Small pills showing USDT/USDC with token icons
- Map integration: Dark-themed interactive map on explore page
- Rating stars: Amber (#F59E0B) filled stars

---

## 💳 CRYPTO PAYMENT FLOW

### Supported Networks
- **Polygon** (low fees, fast) — Primary
- **Base** (Coinbase L2) — Secondary
- **Ethereum Mainnet** — Optional for large bookings

### Supported Tokens
- **USDT** (Tether USD)
- **USDC** (USD Coin)

### Payment Flow (Step by Step)

```
1. Tourist selects a gig and clicks "Book Now"
2. Tourist fills booking form (date, group size, special requests)
3. System calculates: totalUSD → converted to USDT/USDC at 1:1
4. Tourist selects: [USDT] or [USDC] and [Polygon] or [Base]
5. Tourist clicks "Connect Wallet" → MetaMask/WalletConnect popup
6. System creates a Booking record with status: AWAITING_PAYMENT
7. Tourist approves ERC-20 token allowance (approve transaction)
8. Tourist sends payment to Explomate escrow smart contract
9. System listens for on-chain confirmation (event listener / webhook)
10. On confirmation: Booking status → CONFIRMED, Guide notified
11. After tour completion: Guide claims funds from escrow
12. Platform automatically deducts commission before release
13. Net USDT/USDC sent to Guide's wallet address
```

### Smart Contract Functions
```solidity
// Core functions needed in the Escrow contract
function createBooking(bytes32 bookingId, address guide, address token, uint256 amount) external
function releaseToGuide(bytes32 bookingId) external onlyAdmin
function refundTourist(bytes32 bookingId) external onlyAdmin
function claimEarnings(bytes32 bookingId) external onlyGuide
function getBooking(bytes32 bookingId) external view returns (BookingInfo)
```

### Frontend Payment Implementation
```typescript
// lib/crypto/payment.ts
import { ethers } from 'ethers'

const USDT_POLYGON = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
const USDC_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
const ESCROW_CONTRACT = process.env.NEXT_PUBLIC_ESCROW_ADDRESS

export async function initiatePayment({
  bookingId,
  amountUSD,
  token, // 'USDT' | 'USDC'
  network // 'polygon' | 'base'
}: PaymentParams) {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  const tokenAddress = token === 'USDT' ? USDT_POLYGON : USDC_POLYGON
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  
  const amount = ethers.parseUnits(amountUSD.toString(), 6) // USDT/USDC = 6 decimals
  
  // Step 1: Approve escrow contract to spend tokens
  const approveTx = await tokenContract.approve(ESCROW_CONTRACT, amount)
  await approveTx.wait()
  
  // Step 2: Call escrow to lock funds
  const escrow = new ethers.Contract(ESCROW_CONTRACT, ESCROW_ABI, signer)
  const payTx = await escrow.createBooking(
    ethers.encodeBytes32String(bookingId),
    guideWalletAddress,
    tokenAddress,
    amount
  )
  
  const receipt = await payTx.wait()
  return receipt.hash // txHash saved to DB
}
```

---

## 🔧 KEY FEATURES TO BUILD

### 1. Gig Creation (Guide)
Multi-step form wizard:
- **Step 1:** Basic Info (title, category, location, country)
- **Step 2:** Details (description, duration, group size, languages, meeting point)
- **Step 3:** Pricing (price in USD — auto-converts to USDT/USDC)
- **Step 4:** Photos (upload 3–10 photos via Cloudinary)
- **Step 5:** What's Included/Excluded, Tags
- **Step 6:** Preview & Publish

### 2. Explore & Search
- Full-text search by title/location/description
- Filters: country, category, price range, duration, language, min rating
- Map view toggle (pins on Mapbox/Google Maps)
- Sorting: Most Popular, Price Low→High, Highest Rated, Newest

### 3. Booking Management
- Guide can: Accept / Decline requests
- Tourist can: Cancel (if > 48h before tour date)
- Status badges: Pending → Awaiting Payment → Confirmed → Completed
- Automated email notifications at each status change

### 4. Review System
- Tourist can leave review only after booking status = COMPLETED
- Rating 1–5 stars + written comment
- Average rating shown on gig card and guide profile
- Review response by guide (optional)

### 5. Earnings Dashboard (Guide)
```
Total Earned (USDT):     $2,480.00
Pending Release:          $320.00
Platform Commission (10%): $248.00
Net Earnings:            $2,232.00

Recent Transactions:
[Booking #XYZ] Bali City Tour → $120 USDT — Released ✅
[Booking #ABC] Ubud Jungle Trek → $80 USDT — Pending ⏳
```

### 6. Wallet Integration UI
- "Connect Wallet" button in navbar (when logged in)
- Wallet connection modal: MetaMask, WalletConnect, Coinbase Wallet
- Display: connected address (truncated), network, USDT/USDC balance
- Switch network prompt if wrong network detected

---

## 💬 REAL-TIME CHAT SYSTEM

### Arsitektur Chat
Gunakan **Supabase Realtime** (PostgreSQL + WebSocket) atau **Pusher Channels** untuk pengiriman pesan real-time tanpa polling.

```
Tourist ──→ Supabase Realtime Channel ──→ Guide
             (channel: "conversation:{id}")
             ↕
        PostgreSQL (persistent storage)
```

### Chat Rules & Flow

```
KAPAN TOURIST BISA CHAT GUIDE:
1. Pre-booking inquiry → Tourist klik "Ask Guide" di halaman gig
2. Post-booking coordination → Otomatis muncul setelah booking CONFIRMED

KAPAN GUIDE BISA CHAT TOURIST:
1. Merespons inquiry
2. Mengirim detail meeting point setelah booking dikonfirmasi
3. Notifikasi perubahan jadwal

PEMBATASAN:
- Free Guide: hanya bisa menerima chat dari tourist yang sudah booking
- Pro/Elite Guide: bisa chat dari semua tourist (inquiry bebas)
- Pesan tidak bisa dihapus permanen (untuk proteksi sengketa)
- Konten transaksi keuangan TIDAK boleh lewat chat (gunakan booking flow)
```

### Fitur Chat Lengkap

**Messaging Features:**
- Teks biasa dengan emoji support
- Kirim foto (max 5MB, via Cloudinary)
- Kirim dokumen (PDF itinerary, tiket — max 10MB)
- Location pin (Google Maps embed)
- Reply ke pesan tertentu (quoted reply)
- Typing indicator ("Guide sedang mengetik...")
- Read receipts (✓ sent, ✓✓ read)
- Timestamp per pesan

**System Messages (auto-generated):**
```
🎉 "Booking #EXP-2341 has been confirmed! You can now coordinate details here."
✅ "Payment of 120 USDT received. Tour is on!"
⭐ "Tour completed! Don't forget to leave a review."
🔔 "Guide has updated the meeting point."
```

**Booking Card dalam Chat:**
```
┌─────────────────────────────────┐
│ 📋 BOOKING CONFIRMED            │
│ Bali Sunset Trek                │
│ 📅 Dec 15, 2025 · 06:00 AM     │
│ 👥 2 people · 💰 80 USDT       │
│ 📍 Kuta Beach Parking Lot       │
│ [View Details]                  │
└─────────────────────────────────┘
```

### Chat UI Implementation

```typescript
// lib/chat/realtime.ts — Supabase Realtime
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function subscribeToConversation(
  conversationId: string,
  onMessage: (msg: Message) => void
) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'Message',
      filter: `conversationId=eq.${conversationId}`
    }, (payload) => onMessage(payload.new as Message))
    .subscribe()
}

export async function sendMessage({
  conversationId,
  senderId,
  content,
  type = 'TEXT',
  mediaUrl
}: SendMessageParams) {
  // 1. Insert to DB (triggers Realtime broadcast)
  const { data } = await supabase
    .from('Message')
    .insert({ conversationId, senderId, content, type, mediaUrl })
    .select()
    .single()

  // 2. Update conversation lastMessageAt
  await supabase
    .from('Conversation')
    .update({ lastMessageAt: new Date().toISOString() })
    .eq('id', conversationId)

  // 3. Trigger push notification to recipient
  await fetch('/api/notifications/push', {
    method: 'POST',
    body: JSON.stringify({ conversationId, senderId, preview: content.slice(0, 60) })
  })

  return data
}
```

### Chat UI Components

```
components/chat/
├── ChatInbox.tsx         # Daftar semua conversations dengan preview + unread badge
├── ChatWindow.tsx        # Full chat window dengan message list
├── MessageBubble.tsx     # Bubble pesan (kanan = sent, kiri = received)
├── MessageInput.tsx      # Input box + emoji picker + media upload + send button
├── TypingIndicator.tsx   # "..." animasi saat lawan sedang mengetik
├── ConversationHeader.tsx # Avatar + nama + link ke profile/gig
├── BookingCard.tsx       # System card dalam chat
├── MediaPreview.tsx      # Thumbnail foto + file attachment
└── ChatNotifBadge.tsx    # Red dot unread count di navbar
```

### Chat Layout (Desktop)

```
┌─────────────────────────────────────────────────────┐
│ MESSAGES                              [Search...]   │
├──────────────┬──────────────────────────────────────┤
│ Conversations│ Ahmad Fariz (Bali Trek)         🟢   │
│              │ ─────────────────────────────── │   │
│ 🟢 Ahmad F.  │ Dec 15 · 06:00 AM · 2 people   │   │
│ "Ok saya...  │                                 │   │
│ 2 menit lalu │  [Booking Card: CONFIRMED ✅]   │   │
│              │                                 │   │
│ Siti R.      │                        Halo!    │   │
│ "Terima kasi │                  Kira2 bawa...  │   │
│ 1 jam lalu   │                                 │   │
│              │ Bawa jaket tebal ya kak,        │   │
│ [+ New Chat] │ pagi hari dingin di sana 🌄     │   │
│              │ ─────────────────────────────── │   │
│              │ [📎] [Type a message...] [Send] │   │
└──────────────┴─────────────────────────────────────┘
```

### Push Notification (Web Push API)

```typescript
// Service Worker untuk notifikasi chat saat tab tidak aktif
self.addEventListener('push', (event) => {
  const data = event.data.json()
  self.registration.showNotification(`Explomate — ${data.senderName}`, {
    body: data.preview,
    icon: '/icons/explomate-192.png',
    badge: '/icons/badge-72.png',
    data: { url: `/dashboard/${data.role}/messages/${data.conversationId}` }
  })
})
```

### Chat Safety & Moderation
- Auto-scan pesan untuk kata kunci berbahaya (off-platform payment request, nomor HP, email)
- Flag otomatis jika guide/tourist coba bertransaksi di luar platform
- Admin dapat melihat dan freeze conversation yang bermasalah
- Tourist/Guide bisa melaporkan pesan ("Report Message") → masuk ke admin queue

---

## 📱 COMPONENT LIST

```
components/
├── layout/
│   ├── Navbar.tsx         # Logo, nav links, wallet connect, user menu
│   ├── Footer.tsx
│   └── DashboardLayout.tsx
├── gigs/
│   ├── GigCard.tsx        # Card shown in explore grid
│   ├── GigGrid.tsx        # Responsive grid of GigCards
│   ├── GigFilters.tsx     # Sidebar filters
│   ├── GigCarousel.tsx    # Photo carousel on detail page
│   └── GigCreateForm.tsx  # Multi-step form
├── booking/
│   ├── BookingWidget.tsx  # Sticky sidebar on gig detail
│   ├── BookingCard.tsx    # In dashboard lists
│   └── BookingStatus.tsx  # Status badge component
├── payment/
│   ├── WalletConnectButton.tsx
│   ├── PaymentModal.tsx   # Token selection + confirm payment
│   ├── TxHashLink.tsx     # Clickable tx hash → block explorer
│   └── NetworkSwitcher.tsx
├── reviews/
│   ├── ReviewCard.tsx
│   ├── ReviewList.tsx
│   └── ReviewForm.tsx
├── ui/
│   ├── StarRating.tsx
│   ├── CryptoBadge.tsx    # "USDT" / "USDC" pill with icon
│   ├── PriceDisplay.tsx   # Shows $120 USD ≈ 120 USDT
│   ├── Avatar.tsx
│   └── LoadingSpinner.tsx
└── map/
    ├── ExploreMap.tsx
    └── GigMapPin.tsx
├── chat/
│   ├── ChatInbox.tsx         # Daftar conversations + unread count
│   ├── ChatWindow.tsx        # Full real-time chat view
│   ├── MessageBubble.tsx     # Bubble sent/received
│   ├── MessageInput.tsx      # Input + emoji + file upload
│   ├── TypingIndicator.tsx   # Animated "..." dots
│   ├── ConversationHeader.tsx
│   ├── BookingCardMsg.tsx    # Booking info card in chat
│   └── ChatNotifBadge.tsx    # Unread indicator
└── monetization/
    ├── PricingTable.tsx      # Subscription plan cards
    ├── BoostModal.tsx        # Gig boost purchase flow
    ├── TipModal.tsx          # Post-tour tip prompt
    └── RevenueChart.tsx      # Admin revenue breakdown chart
```

---

## 🔐 SECURITY & PLATFORM RULES

- All payments go through escrow — never direct wallet-to-wallet
- Guide wallet address verified before allowing fund release
- Rate limiting on API routes (prevent spam bookings)
- JWT-based session management via NextAuth
- Admin-only routes protected by middleware
- Smart contract audited before mainnet deployment (use OpenZeppelin base)
- Never store private keys — only public wallet addresses
- Commission deducted automatically at smart contract level

---

## 💰 PLATFORM MONETIZATION (MULTI-STREAM)

Explomate menghasilkan pendapatan dari **5 sumber** yang saling melengkapi, semuanya diterima dalam USDT/USDC.

---

### Stream 1 — Booking Commission (Utama)
```
Model: Persentase dari setiap transaksi yang selesai
Rate:  10% default (configurable per tier)

Contoh:
  Tourist membayar  → 100 USDT
  Guide menerima    →  90 USDT
  Explomate dapat   →  10 USDT  ✅ otomatis via smart contract

Estimasi bulanan (100 booking × $80 avg × 10%) = $800/bulan
```

---

### Stream 2 — Guide Subscription Plans (Recurring)

Guide membayar langganan bulanan/tahunan dalam USDT untuk mendapatkan benefit lebih.

| Plan        | Harga/bulan | Harga/tahun | Commission | Max Gigs | Benefit Utama                         |
|-------------|------------|------------|------------|----------|---------------------------------------|
| **Free**    | $0         | $0         | 15%        | 3 gigs   | Basic listing, standard search rank   |
| **Explorer**| $9 USDT    | $79 USDT   | 10%        | 10 gigs  | Verified badge, priority support      |
| **Pro**     | $19 USDT   | $169 USDT  | 7%         | Unlimited| Featured in search, analytics dashboard, custom profile URL |
| **Elite**   | $39 USDT   | $349 USDT  | 5%         | Unlimited| Homepage feature slot, AI booking insights, dedicated account manager |

```typescript
// Subscription payment flow
// Guide selects plan → pays via USDT → subscription activated for 30/365 days
// Commission rate automatically applied from their active subscription

function getCommissionRate(userId: string): Promise<number> {
  const sub = await getActiveSubscription(userId)
  return sub?.plan.commissionRate ?? 0.15 // default 15% for Free
}
```

**Revenue estimasi (50 Pro guides × $19/bulan):** $950/bulan recurring

---

### Stream 3 — Gig Boost & Promoted Listings

Guide dapat membayar untuk meningkatkan visibilitas gig mereka.

| Boost Type           | Harga   | Durasi | Penempatan                              |
|----------------------|---------|--------|-----------------------------------------|
| **Top Search Pin**   | $5 USDT | 7 hari | Gig muncul di baris pertama search      |
| **Category Banner**  | $8 USDT | 7 hari | Banner di halaman kategori tertentu     |
| **Homepage Feature** | $15 USDT| 7 hari | Kartu di section "Featured" landing page|
| **Super Boost**      | $25 USDT| 14 hari| Top search + Homepage + Email blast     |

```typescript
// Boost purchase flow
async function purchaseBoost(gigId: string, boostType: BoostType, durationDays: number) {
  const prices = { TOP_SEARCH: 5, CATEGORY_BANNER: 8, FEATURED_HOME: 15, SUPER: 25 }
  const amount = prices[boostType]
  
  // 1. Tourist pays USDT to platform wallet (not escrow)
  // 2. Boost record created in DB
  // 3. Gig rank elevated in search algorithm
  // 4. Auto-expires after durationDays
}
```

---

### Stream 4 — Tourist Tips (Opsional)

Setelah tour selesai, tourist bisa memberikan tip dalam USDT/USDC.

```
Tourist memberikan tip: 10 USDT
Guide menerima:          9 USDT (90%)
Explomate dapat:         1 USDT (10% tip fee)

UI: Setelah klik "Mark as Completed", muncul prompt:
"Did you enjoy your tour? Leave a tip for your guide!"
[5 USDT] [10 USDT] [20 USDT] [Custom]
```

---

### Stream 5 — Tourist Premium (Opsional Future)

| Plan          | Harga/bulan | Benefit                                         |
|---------------|------------|--------------------------------------------------|
| **Free**      | $0         | Max 3 active bookings, standard search           |
| **Wanderer**  | $4.99 USDT | Unlimited bookings, early access to new guides   |
| **Explorer+** | $9.99 USDT | Priority booking (skip waitlist), trip insurance badge, exclusive guides |

---

### 📊 REVENUE DASHBOARD (Admin)

```
EXPLOMATE REVENUE — June 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Booking Commission:     $1,240 USDT   ████████████░░  52%
Guide Subscriptions:    $  760 USDT   ████████░░░░░░  32%
Gig Boosts:            $  280 USDT   ███░░░░░░░░░░░  12%
Tip Fees:              $   96 USDT   █░░░░░░░░░░░░░   4%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                $2,376 USDT   🟢 +18% vs last month

Platform Wallet Balance: 4,820.50 USDT (Polygon)
Pending Commission:        312.00 USDT (in escrow)
```

---

### Smart Contract Commission Logic

```solidity
// ExplomateEscrow.sol — commission deduction
function releaseToGuide(bytes32 bookingId) external onlyAdmin {
    BookingInfo storage b = bookings[bookingId];
    require(b.status == BookingStatus.CONFIRMED, "Not confirmed");
    
    uint256 commission = (b.amount * commissionBps) / 10000; // bps = basis points
    uint256 guideAmount = b.amount - commission;
    
    // Transfer net to guide
    IERC20(b.token).transfer(b.guide, guideAmount);
    // Transfer commission to platform treasury
    IERC20(b.token).transfer(platformTreasury, commission);
    
    b.status = BookingStatus.RELEASED;
    emit FundsReleased(bookingId, guideAmount, commission);
}

// Admin can update commission per guide based on their subscription tier
function setGuideCommissionBps(address guide, uint256 bps) external onlyAdmin {
    guideCommissions[guide] = bps; // 1000 = 10%, 500 = 5%, 1500 = 15%
}
```

---

## 🚀 LAUNCH CHECKLIST

### MVP (Phase 1)
- [ ] Auth system (register as Tourist / Guide)
- [ ] Guide can create and publish gigs
- [ ] Tourist can browse, search, and view gigs
- [ ] Booking flow (without crypto — just "confirm booking" first)
- [ ] Basic chat (Tourist ↔ Guide, text only)
- [ ] Email notifications
- [ ] Basic dashboard for both roles
- [ ] Review system

### Phase 2 (Crypto + Chat Full)
- [ ] Wallet connect (MetaMask, WalletConnect)
- [ ] Payment flow with USDT/USDC on Polygon
- [ ] Escrow smart contract deployment
- [ ] On-chain transaction verification
- [ ] Earnings dashboard with withdrawal tracking
- [ ] Real-time chat (Supabase Realtime)
- [ ] Chat media upload (images, files)
- [ ] Push notifications (Web Push API)
- [ ] Booking card system messages in chat

### Phase 3 (Monetization)
- [ ] Guide subscription plans (Free / Explorer / Pro / Elite)
- [ ] Subscription payment in USDT
- [ ] Dynamic commission rate per subscription tier
- [ ] Gig Boost feature (Top Search, Featured Home, Category Banner)
- [ ] Tourist tipping system post-tour
- [ ] Admin revenue dashboard with multi-source breakdown
- [ ] Platform treasury wallet management

### Phase 4 (Growth)
- [ ] Multi-language support (EN, ID, ES, FR, JA)
- [ ] Mobile-responsive optimization
- [ ] Guide verification badge system
- [ ] Referral program (Tourist refers → earns $5 USDT credit)
- [ ] Mobile app (React Native)
- [ ] Tourist Premium subscription

---

## 🗂️ FOLDER STRUCTURE

```
explomate/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Landing page
│   │   ├── explore/page.tsx
│   │   └── gigs/[id]/page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── tourist/
│   │   └── guide/
│   ├── admin/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── gigs/
│       ├── bookings/
│       ├── reviews/
│       ├── payments/
│       ├── conversations/
│       ├── messages/
│       ├── subscriptions/
│       ├── boosts/
│       ├── tips/
│       ├── notifications/
│       └── admin/
├── components/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── crypto/
│   │   ├── payment.ts
│   │   ├── contracts.ts
│   │   └── abis/
│   ├── chat/
│   │   ├── realtime.ts       # Supabase Realtime subscription helpers
│   │   ├── push.ts           # Web Push notification helpers
│   │   └── moderation.ts     # Auto-flag off-platform content
│   ├── monetization/
│   │   ├── subscription.ts   # Plan management + commission lookup
│   │   ├── boost.ts          # Gig boost logic
│   │   └── tip.ts            # Tip payment flow
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── assets/
├── contracts/              # Solidity escrow contract
│   └── ExplomateEscrow.sol
└── types/
    └── index.ts
```

---

## 🧩 EXAMPLE PROMPTS (Use These to Build Section by Section)

Use the following sub-prompts when building with an AI coding assistant:

**Prompt A — Landing Page:**
> "Build the Explomate landing page in Next.js with Tailwind CSS. Include: hero section with tagline 'Explore the World. Pay in the Future.', animated search bar for destination, how-it-works section (3 steps for tourists, 3 for guides), featured gigs grid (6 mock gigs), testimonials carousel, and footer. Use color palette: primary #0EA5E9, dark bg #0F172A. Font: Plus Jakarta Sans."

**Prompt B — Gig Card Component:**
> "Create a GigCard React component for Explomate. It should display: cover image (Cloudinary URL), guide avatar + name, gig title, location with flag emoji, duration, price in USD + equivalent USDT badge, star rating + review count, category tag. On hover: subtle scale animation. Make it a Next.js Link to /gigs/[id]."

**Prompt C — Booking + Payment Modal:**
> "Build a PaymentModal component for Explomate. It shows: booking summary (gig title, date, group size), price in USD and selected crypto (USDT/USDC), network selector (Polygon/Base), wallet address display, and a 'Confirm & Pay' button. Use ethers.js to trigger ERC-20 approve + escrow contract call. Show transaction status (pending spinner → success with tx hash link)."

**Prompt D — Guide Dashboard:**
> "Create the Explomate Guide Dashboard overview page. Show: total earnings card (USDT), pending bookings count, upcoming tours this week, recent transactions table, and a quick-action button to 'Create New Gig'. Use recharts for a monthly earnings bar chart. Dark theme with #1E293B card backgrounds."

**Prompt E — Escrow Smart Contract:**
> "Write a Solidity escrow smart contract for Explomate. It should: accept ERC-20 deposits (USDT/USDC) from tourists, lock funds until admin or automated release, allow admin to release to guide or refund tourist, deduct commission based on guide's subscription tier (stored in guideCommissions mapping), emit events for all state changes. Inherit from OpenZeppelin Ownable and ReentrancyGuard."

**Prompt F — Real-time Chat System:**
> "Build a full real-time chat system for Explomate using Supabase Realtime and Next.js. Create: (1) ChatInbox component showing all conversations with unread count badges, (2) ChatWindow component with real-time message rendering, (3) MessageInput with text, emoji picker, and image upload via Cloudinary, (4) TypingIndicator with animated dots, (5) System message cards for booking confirmations. Use Supabase postgres_changes subscription for real-time delivery. Style: dark theme #1E293B, user messages right-aligned in #0EA5E9 bubbles, received messages left-aligned in #334155."

**Prompt G — Subscription Pricing Page:**
> "Build the Explomate Guide subscription pricing page. Show 4 plan tiers: Free ($0), Explorer ($9/mo), Pro ($19/mo), Elite ($39/mo). Each card shows: plan name, price, commission rate badge, feature list with checkmarks, and a 'Subscribe' button. Popular plan (Pro) has a highlighted border. Payment is in USDT via MetaMask. Toggle between Monthly/Yearly pricing (yearly = 2 months free). Use glassmorphism card style with #0F172A background."

**Prompt H — Gig Boost Purchase Flow:**
> "Create a BoostModal component for Explomate where Tour Guides can promote their gigs. Show 4 boost options: Top Search Pin ($5/7d), Category Banner ($8/7d), Homepage Feature ($15/7d), Super Boost ($25/14d). Each option shows: placement preview thumbnail, expected impression count, price in USDT. User selects one option, connects wallet, approves and sends USDT to platform wallet. On success show confetti animation and redirect to gig page with 'Boosted 🚀' badge."

**Prompt I — Admin Revenue Dashboard:**
> "Build the Explomate Admin Revenue Dashboard. Display: (1) KPI cards — Total Revenue (USDT), This Month, MoM growth %. (2) Recharts stacked bar chart showing monthly revenue broken down by source: Booking Commission, Subscriptions, Gig Boosts, Tips. (3) Revenue source donut chart. (4) Recent transactions table with columns: Date, Source, Amount USDT, Tx Hash (clickable → Polygonscan), Reference ID. (5) Platform wallet balance pulled via ethers.js. Dark theme admin layout."

---

*Built with ❤️ by Explomate Team — Where Adventure Meets Web3*
