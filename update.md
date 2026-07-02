CONTINUE THE EXISTING PROJECT. DO NOT REWRITE THE APPLICATION FROM SCRATCH.

We are building a Web3 tourism marketplace called Explomate.

Current architecture already exists. Extend the existing codebase with the following features.

==================================================
PAYMENT SYSTEM (USDC ON BASE)
==================================================

Implement a platform fee system using USDC.

Business Rules:

1. Tour Guide creates a Gig.

Example:

Guide wants to earn:
95 USDC

2. System automatically calculates platform fee.

Formula:

client_price = guide_price / 0.95

Example:

Guide enters:
95 USDC

Tourist sees:
100 USDC

Platform fee:
5 USDC

Guide must be informed before publishing:

"You will receive 95 USDC.
Tourists will pay 100 USDC.
Explomate platform fee is 5 USDC."

3. Store both values in database:

guide_price
client_price
platform_fee

4. Tourist ONLY sees client_price.

5. Tour Guide dashboard shows:

Expected Earnings:
95 USDC

Customer Price:
100 USDC

Platform Fee:
5 USDC

==================================================
ESCROW PAYMENT SPLIT
==================================================

Current escrow system must be modified.

When tourist funds the booking:

100 USDC
goes into escrow.

When booking is completed:

95 USDC
automatically transferred to Tour Guide wallet.

5 USDC
automatically transferred to Platform Treasury wallet.

No manual payout.

No custodial balance.

Use smart contract payment splitting.

Treasury wallet address must be configurable via environment variable:

NEXT_PUBLIC_PLATFORM_TREASURY

==================================================
SUBSCRIPTION SYSTEM
==================================================

Implement subscription tiers for Tour Guides.

FREE

- Can create gigs
- Normal ranking

PRO

10 USDC/month

Benefits:

- Priority ranking boost
- Featured badge
- Better dashboard analytics
- Higher visibility

ELITE

25 USDC/month

Benefits:

- Strong ranking boost
- Featured badge
- Premium placement
- Homepage priority
- Highest visibility

Store:

subscription_type
subscription_expiry

Subscription payment must be made using USDC.

==================================================
DISCOVERABILITY ALGORITHM
==================================================

Implement ranking score.

Do NOT rank solely by newest.

Create ranking_score.

Example:

ranking_score =
(
rating * 0.35
+
review_count_factor * 0.15
+
booking_count_factor * 0.15
+
subscription_factor * 0.20
+
featured_factor * 0.10
+
activity_factor * 0.05
)

Subscription weights:

FREE = 1.0

PRO = 1.5

ELITE = 2.0

Featured weights:

Not Featured = 1.0

Featured = 1.3

Activity factor based on:

recent logins
recent updates
recent bookings

==================================================
SEARCH RESULTS
==================================================

Default search order:

1. Ranking Score DESC
2. Rating DESC
3. Reviews DESC
4. Newest DESC

==================================================
FEATURED BOOST
==================================================

Allow guides to purchase:

Featured Gig

Cost:
5 USDC

Duration:
7 days

Effects:

featured_factor enabled.

Featured gigs appear higher in search results.

==================================================
ANTI-PAY-TO-WIN
==================================================

Subscription alone should not dominate rankings.

A guide with terrible ratings should never outrank a guide with excellent ratings solely because of subscription.

Maintain balanced ranking.

Quality signals must remain strongest ranking factor.

==================================================
DATABASE CHANGES
==================================================

Add fields:

guide_price
client_price
platform_fee

subscription_type
subscription_expiry

featured_until

ranking_score

booking_count

==================================================
ADMIN SETTINGS
==================================================

Create configuration variables:

PLATFORM_FEE_PERCENT=5

PRO_MONTHLY_PRICE=10

ELITE_MONTHLY_PRICE=25

FEATURED_GIG_PRICE=5

TREASURY_WALLET_ADDRESS

Values should be editable without changing business logic.

==================================================
IMPLEMENTATION REQUIREMENT
==================================================

Modify existing code only.

Reuse existing wallet, escrow, booking, gig, and user systems.

Avoid breaking current functionality.

Generate migrations, smart contract updates, backend logic, API endpoints, database schema updates, and frontend UI required for these features.