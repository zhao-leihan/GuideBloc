# PHASE 2 — GUIDEBLOC PAYMENT INFRASTRUCTURE

## Spec & Build Prompt untuk AI Agent

> **Konteks:** GuideBloc adalah marketplace P2P yang menghubungkan turis internasional dengan tour guide terverifikasi di Indonesia, menggunakan smart contract escrow di Avalanche C-Chain, settlement USDC/USDT, dan payout IDR ke guide via BI-FAST.
> >
> **Aturan keras (HARD CONSTRAINTS):**
> 1. ❌ DILARANG menggunakan onramp/offramp retail (MoonPay, Transak, Ramp, dsb) dalam bentuk apa pun.
> 2. ❌ DILARANG guide menerima/menyentuh crypto langsung dalam mode IDR payout.
> 3. ❌ Crypto TIDAK BOLEH menjadi alat pembayaran domestik di Indonesia (compliance).
> 4. ✅ Semua transaksi HARUS melalui smart contract escrow on-chain.
> 5. ✅ Refund HARUS instan (< 5 detik untuk on-chain, < 60 detik untuk balance credit).
> 6. ❌ DILARANG proof-of-agreement berupa foto. Wajib bukti kriptografis.

---

## 1. TUJUAN PHASE 2

Phase 1 (landing page + demo) sudah selesai. Phase 2 membangun **payment & settlement core**:

1. Smart contract escrow produksi-ready di Avalanche C-Chain.
2. Treasury Float Model: konversi USDC/USDT → IDR via OTC + payout BI-FAST, tanpa onramp.
3. Four-mode payment flows (lihat §3).
4. Agreement signing pakai EIP-712 (ganti foto).
5. Completion attestation (GPS + 1-klik konfirmasi).
6. Instant refund path.
7. Pricing engine dengan margin guide 0–3%.

**Non-goals Phase 2:** mobile app native, dispute resolution UI lengkap, multi-country expansion, yield/investasi treasury.

---

## 2. ARSITEKTUR SISTEM (Treasury Float Model)

```javascript
┌──────────┐   USDC/USDT    ┌──────────────────┐
│  TURIS   │───────────────▶│ ESCROW CONTRACT  │──┐
│ (wallet) │                │   (Avalanche)    │  │
└──────────┘                └──────────────────┘  │
       ▲                             │ release    │
       │ refund (1 tx)               ▼            │
       │                    ┌──────────────────┐  │
┌──────┴───────┐            │ TREASURY WALLET  │◀─┘
│ TURIS (fiat) │            │  (multisig 2/3)  │
└──────────────┘            └────────┬─────────┘
   acquiring float                   │ OTC desk / exchange lokal berlisensi
       │                            ▼ (spread 0.1–0.3%)
       │                     ┌──────────────┐
       │                     │ REKENING IDR │─── BI-FAST ──▶ GUIDE (IDR, detik)
       │                     │  (segregated)│
       │                     └──────────────┘
       ▼
┌──────────────┐
│ GUIDE (IDR)  │◀────────── BI-FAST payout (biaya Rp0–2.500, real-time 24/7)
└──────────────┘
```

**Prinsip:** Treasury adalah counterparty likuiditas di kedua sisi. Konversi crypto↔IDR dilakukan secara institusional (OTC / exchange berlisensi), BUKAN onramp retail.

---

## 3. FOUR-MODE PAYMENT MATRIX

| Mode | Turis bayar | Guide terima | Flow |
| --- | --- | --- | --- |
| A | USDC/USDT (on-chain) | IDR | Escrow → treasury → OTC → BI-FAST |
| B | USDC/USDT (on-chain) | USDC/USDT | Escrow release langsung ke wallet guide |
| C | Fiat (kartu, via acquiring) | IDR | Acquiring → float IDR → treasury top-up escrow on-chain → release → BI-FAST |
| D | Fiat (kartel, via acquiring) | USDC/USDT | Acquiring → treasury → escrow top-up → release ke wallet guide |

- Mode A adalah mode utama untuk launch (turis Web3 native → guide Indonesia terima rupiah).
- Mode B untuk guide yang opt-in wallet sendiri.
- Mode C/D menggunakan float IDR treasury sebagai jembatan; turis fiat TIDAK perlu tahu ada blockchain di belakang.
- Default guide: Mode A (IDR). Guide bisa toggle ke Mode B di settings.

---

## 4. SMART CONTRACT SPEC (Avalanche C-Chain)

### 4.1 Kontrak: `GuideBlocEscrow.sol`

**State per booking:**

```solidity
struct Booking {
    bytes32 bookingId;        // hash off-chain booking record
    address traveler;         // payer
    address payable guide;    // guide wallet (mode B) atau treasury (mode A/C/D)
    address token;            // USDC atau USDT (whitelist only)
    uint256 amount;
    uint256 createdAt;
    uint256 serviceDeadline;  // batas waktu tour berlangsung
    uint256 disputeWindowEnd; // serviceDeadline + 24–48 jam
    uint8 status;             // 0=FUNDED 1=COMPLETED 2=REFUNDED 3=DISPUTED 4=AUTO_RELEASED
    bytes32 agreementHash;    // keccak256 hash EIP-712 agreement (lihat §6)
    bytes32 completionAttestation; // hash attestation GPS/QR (lihat §7)
}
```

**Fungsi wajib:**

| Fungsi | Akses | Behavior |
| --- | --- | --- |
| `createBooking(bookingId, guide, token, amount, serviceDeadline, agreementHash)` + transfer token | traveler | Fund escrow. Validasi: token whitelisted, amount > 0, deadline > now. Emit `BookingFunded`. |
| `confirmCompletion(bookingId, attestationHash)` | traveler (1-klik) | Set status COMPLETED, release dana ke penerima sesuai mode payout. Emit `BookingCompleted`. |
| `refund(bookingId)` | traveler atau guide (mutual) sebelum `serviceDeadline` | Refund penuh ke traveler, instan. Emit `BookingRefunded`. |
| `openDispute(bookingId, reasonHash)` | traveler/guide | Set status DISPUTED, freeze dana sampai resolver menangani. |
| `resolveDispute(bookingId, refundBps, resolverSig)` | resolver role (multisig/tim) | Split payout sesuai persentase refund. Emit `DisputeResolved`. |
| `autoRelease(bookingId)` | anyone (keeper/bot) | Jika `disputeWindowEnd` lewat dan tidak ada dispute → release ke guide. |
| `updateTreasury(address)` | owner (timelock) | Ganti treasury wallet. |

**Keamanan wajib:**

- Token whitelist: hanya USDC & USDT (mainnet addresses resmi — USDC.e/native USDC & USDT di Avalanche).
- ReentrancyGuard semua fungsi payout.
- Pull-over-push pattern tidak wajib; push OK karena counterparty terbatas (treasury/guide terverifikasi).
- Pausable (emergency stop) oleh multisig.
- Semua payout via `SafeERC20`.
- Events lengkap untuk indexer: `BookingFunded`, `BookingCompleted`, `BookingRefunded`, `DisputeOpened`, `DisputeResolved`, `AutoReleased`.

### 4.2 Deployment

- Chain: Avalanche C-Chain (chainId 43114).
- Verifikasi source di Snowscan.
- Deploy via multisig 2/3 (founder x2 + 1 advisor/auditor).
- Initial audit internal + unit test coverage ≥ 90% fungsi state-changing.

---

## 5. TREASURY & SETTLEMENT SERVICE

### 5.1 Komponen backend (Node.js/TypeScript atau Go):

**a) Treasury Ledger (double-entry, off-chain)**

- Setiap movement tercatat debit/credit: `escrow_in`, `otc_sell`, `idr_payout`, `fee_revenue`, `float_topup`, `refund_balance_credit`.
- Ledger immutable (append-only), reconciliation otomatis tiap 5 menit terhadap on-chain events via indexer.
- Idempotency key wajib di semua payout job.

**b) FX / OTC Module**

- Integrasi ke exchange lokal berlisensi (Bappebti/OJK) via API atau P2P desk manual untuk volume awal.
- Target spread ≤ 0,3%. Konversi dieksekusi otomatis saat saldo USDC > threshold (misal $500) atau scheduled batch tiap 30 menit.
- Rate lock saat booking dibuat: harga IDR ditampilkan ke guide di-locked 15 menit (slippage buffer 0,5% masuk fee).

**c) BI-FAST Payout Adapter**

- Integrasi bank partner via API (atau agregator lokal berlisensi).
- Antrian payout dengan retry + dead-letter queue. Payout hanya ke rekening atas nama guide yang terverifikasi KYC (nama cocok dengan data bank — wajib validasi).
- Notifikasi WhatsApp/email ke guide saat payout sukses.

### 5.2 Float Management

- Minimum float IDR: 2x rata-rata payout harian (anti-liquidity-crunch).
- Minimum float USDC: $1.000 atau 2x rata-rata settle harian.
- Alert ke tim kalau float di bawah threshold 50%.

---

## 6. AGREEMENT SIGNING — EIP-712 (PENGGANTI FOTO)

**Tujuan:** bukti persetujuan kriptografis yang legally meaningful, anti-dispute, tanpa satu foto pun.

**Schema typed data:**

```json
{
  "domain": {
    "name": "GuideBloc Booking Agreement",
    "version": "1",
    "chainId": 43114,
    "verifyingContract": "<escrow address>"
  },
  "message": {
    "bookingId": "0x...",
    "traveler": "0x...",
    "guide": "0x...",
    "amount": "50000000",
    "token": "0xUSDC",
    "serviceDate": "2026-10-01",
    "meetingPoint": "Gate 3, I Gusti Ngurah Rai Airport",
    "itineraryHash": "0x...",       // hash itinerary dokumen
    "cancellationPolicyHash": "0x...", // hash policy (refund 100% H-3, 50% H-1, dst)
    "deadline": 1696118400
  }
}
```

**Flow:**

1. Booking dibuat → backend generate agreement payload.
2. Turis sign via wallet (SIWE/session key di app) → `travelerSig`.
3. Guide sign via app (wallet backend/guide signer) → `guideSig`.
4. `agreementHash = keccak256(abi.encode(bookingId, travelerSig, guideSig))` → disimpan di kontrak saat `createBooking`.
5. PDF agreement (ter-render dari data yang sama) disimpan di storage untuk kebutuhan legal, tapi **sumber kebenaran = signature on-chain**, bukan PDF/foto.

**Acceptance:** dispute resolver cukup verifikasi dua signature valid untuk membuktikan kedua pihak setuju terms.

---

## 7. COMPLETION ATTESTATION (PENGGANTI FOTO BUKTI TOUR)

Hapus upload foto. Ganti dengan 3 lapis (bertingkat):

1. **1-Klik konfirmasi turis (primer):** turis tap "Tour selesai" → app trigger signature → `confirmCompletion()`. Ini path default.
2. **GPS check-in/out attestation:** saat check-in meeting point, app guide & turis sign payload `{bookingId, lat, lng, timestamp}` — minimal 1 signature dari masing-masing pihak. Hash-nya masuk `completionAttestation`.
3. **QR/NFC scan (opsional, anti-gps-spoofing):** guide display QR dinamis, turis scan → server verifikasi proximity.

**Auto-release:** kalau 48 jam setelah `serviceDeadline` turis tidak confirm & tidak dispute → keeper bot panggil `autoRelease()`.

**Penanganan turis jahat (sudah tour tapi tidak confirm):** guide bisa trigger `openDispute` + submit GPS attestation → resolver (tim) release manual dengan bukti attestation + agreement.

---

## 8. INSTANT REFUND DESIGN

| Skenario | Mekanisme | SLA |
| --- | --- | --- |
| Cancel sebelum service deadline (mutual) | `refund()` on-chain, dana balik ke wallet turis | < 5 detik |
| Turis bayar fiat & refund | Credit ke saldo GuideBloc (usable untuk booking lain / withdraw ke rekening) | < 60 detik |
| Refund sebagian (dispute) | `resolveDispute(refundBps)` | < 5 detik on-chain |
| Refund fiat ke metode asli | Hanya atas request eksplisit; via acquiring refund (jujur ke user: 3–7 hari sesuai bank) | best effort |

**UI wajib:** tombol "Refund" di booking detail (pre-service), status refund real-time, dan kebijakan refund yang hash-nya masuk agreement (§6) supaya nggak ada sengketa soal terms.

---

## 9. PRICING ENGINE

**Biaya ke guide:**

- Default: **0%** untuk 3 bulan pertama (user acquisition).
- Setelah itu: 1–3% tiered berdasarkan volume bulanan. OTA kompetitor charge 15–25% — ini selling point utama.

**Biaya ke turis (service fee, all-in transparan):**

- Target: 4–6% all-in (sudah termasuk FX, network, treasury ops).
- Breakdown internal: COGS < 0,5% (gas Avalanche ~$0.01, OTC spread 0,1–0,3%, BI-FAST Rp0–2.500) → **gross margin 80%+**.
- Fee ditampilkan sebagai satu angka transparan: "Service fee 5% — no hidden FX markup".

**Fitur engine:**

- Rate lock 15 menit saat checkout (buffer slippage 0,5%).
- Volume discount otomatis untuk repeat turis/agency.
- Kupon zero-fee promo (subsidi dari margin).
- Treasury FX timing: konversi batch saat rate optimal — surplus spread jadi revenue tambahan, bukan biaya user.

---

## 10. COMPLIANCE CHECKLIST (INDONESIA)

1. Crypto **dilarang** sebagai alat pembayaran domestik → rupiah satu-satunya yang guide terima (Mode A/C mematuhi ini).
2. PT lokal dengan rekening **segregated** di bank komersial berlisensi OJK; treasury float tidak boleh dicampur dana operasional.
3. Stablecoin diperlakukan sebagai "alat transaksi" (bukan alat pembayaran) — ikuti kategori UU 4/2026, rekomendasi bursa + approval OJK.
4. KYC guide wajib (KTP + rekening bank atas nama sama) sebelum payout aktif.
5. Turis TIDAK perlu KYC untuk Mode A/B (on-chain, non-custodial kecuali fiat balance). Mode C/D ikuti aturan PSP acquiring.
6. Catat semua transaksi untuk pelaporan pajak; siapkan export CSV bulanan.
7. Dokumen legal: Terms of Service, Escrow Agreement, Refund Policy — hash semua policy masuk agreement schema.

---

## 11. TECH STACK REKOMENDASI

| Layer | Stack |
| --- | --- |
| Smart contract | Solidity ^0.8.24, Foundry (test + deploy), OpenZeppelin |
| Indexer | The Graph subgraph atau custom indexer (viem + ponder) |
| Backend | Node.js/TypeScript (NestJS), PostgreSQL, Redis queue (BullMQ) |
| Payout/FX jobs | Worker service terpisah, idempotent, DLQ |
| Wallet/auth | SIWE (Sign-In with Ethereum), session keys untuk UX 1-klik |
| Frontend | Next.js + wagmi/viem + WalletConnect |
| Observability | Structured logs, on-chain monitoring (OpenZeppelin Defender), balance alert |
| Secrets | Multisig + timelock; kunci treasury di MPC/HSM |

---

## 12. BREAKDOWN TUGAS UNTUK AI AGENT (URUTAN EKSEKUSI)

**Sprint A — Smart Contract (prioritas)**

- [ ] Scaffold Foundry project, setup Avalanche fork testing.
- [ ] Implement `GuideBlocEscrow.sol` lengkap per §4 (semua fungsi + events + guards).
- [ ] Token whitelist USDC/USDT mainnet Avalanche addresses.
- [ ] Unit tests: create, confirm, refund, dispute, resolve, autoRelease, edge cases (double refund, deadline passed, wrong token).
- [ ] Fuzz test fungsi state-changing.
- [ ] Deploy Fuji testnet + verifikasi + mock USDC faucet.

**Sprint B — Agreement & Attestation**

- [ ] EIP-712 typed data generator + verify util (backend).
- [ ] Signing flow API: create agreement → collect traveler sig → collect guide sig → store agreementHash.
- [ ] GPS check-in/out signing endpoint + hash storage.
- [ ] Integrasi agreementHash ke `createBooking`.

**Sprint C — Treasury Ledger & Payout**

- [ ] Double-entry ledger schema + migration.
- [ ] Event indexer: subscribe BookingFunded/Completed/Refunded → ledger entries.
- [ ] FX module (mock OTC dulu via config rate; integrasi exchange sungguhan jadi TODO ber-label).
- [ ] BI-FAST payout adapter (mock bank API dulu; interface clean untuk swap ke agregator nyata).
- [ ] Reconciliation job + float alert.

**Sprint D — Refund & UX Flow**

- [ ] Refund endpoints (on-chain path + fiat balance credit path).
- [ ] Booking status UI: funded → in-service → completed/refunded/disputed.
- [ ] 1-klik confirm completion di app turis.
- [ ] Auto-release keeper bot (cron + on-chain call).

**Sprint E — Pricing Engine**

- [ ] Fee config service (guide fee %, turis fee %, slippage buffer, promo codes).
- [ ] Rate lock + quote endpoint (USD→IDR, 15 menit TTL).
- [ ] Pricing display di checkout + invoice breakdown.

**Sprint F — Hardening**

- [ ] Reconciliation report harian (ledger vs on-chain vs bank).
- [ ] Alerting: float di bawah threshold, payout gagal, kontrak paused.
- [ ] Testnet E2E: turis wallet → escrow → confirm → treasury ledger → mock payout.
- [ ] Docs: README arsitektur + runbook operasional.

---

## 13. ACCEPTANCE CRITERIA (DEFINITION OF DONE)

1. Turis bisa fund booking USDC testnet → guide (mode mock) menerima entry payout IDR di ledger < 60 detik setelah confirm.
2. Refund pre-service selesai < 5 detik on-chain.
3. Agreement dua pihak tersimpan sebagai valid EIP-712 signatures; dispute resolver bisa verifikasi independen.
4. Tidak ada satu pun field upload foto di schema booking/attestation.
5. Tidak ada dependency onramp/offramp di codebase (cek: grep "moonpay|transak|ramp|onramper" = kosong).
6. Kontrak lulus semua unit + fuzz test, deploy Fuji terverifikasi.
7. Ledger double-entry balance = 0 untuk semua pair akun di test scenario.
8. Semua status transaksi bisa dilacak end-to-end: bookingId → tx hash → ledger entry → payout entry.

---

## 14. RISKS & MITIGASI

| Risk | Mitigasi |
| --- | --- |
| Treasury float kering | Float threshold 2x daily average + alert 50% + auto-buy dari exchange |
| Rate slippage IDR | Rate lock 15 menit + 0,5% buffer masuk fee |
| Turis tidak confirm completion | Auto-release 48 jam + dispute path pakai GPS attestation |
| Smart contract exploit | Multisig 2/3, pausable, audit sebelum mainnet, bug bounty |
| Regulasi berubah | Arsitektur treasury = single point of swap ke model partner berlisensi penuh |
| Guide salah rekening/fraud payout | Nama rekening wajib match KYC; payout whitelist rekening |

---

*Dokumen ini adalah spec final Phase 2. Kalau ada konflik dengan Phase 1 docs, dokumen ini yang berlaku. Semua angka threshold (float, fee %, dispute window) di-config, bukan hardcode.*