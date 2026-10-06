# GUIDEBLOC CORE DEVELOPMENT RULES (REMIND.MD)

These rules are MANDATORY and ABSOLUTE. Always review and strictly follow these rules before writing or modifying any code.

---

## 1. LANGUAGE: 100% ENGLISH ONLY
- **ALL** text, headings, buttons, labels, notifications, toasts, modals, badges, error messages, tooltips, and descriptions inside the website MUST be written in **ENGLISH**.
- **NO INDONESIAN** in the frontend or backend user-facing text.

---

## 2. STRICTLY NO EMOJIS IN THE UI
- **NEVER** use emojis in the UI (e.g. NO 🚨, ⚡, 🚀, 🎉, ⚠️, 🪙, 📈, etc.).
- Always use professional SVG icons from `lucide-react` with proper sizing and clean styling.

---

## 3. COLOR PALETTE & DESIGN HARMONY
- **NO CLASHING COLORS**: Never mix red directly with blue (e.g. red alert container with a bright blue button).
- Use cohesive, premium palettes:
  - Danger/Warning states: Neutral dark or subtle rose/slate borders with matching dark/neutral action buttons (e.g. `bg-dark-900 text-white` or monochromatic outline buttons).
  - Primary UI: Deep dark background (`#0B0F17` / dark slate), crisp white typography, subtle borders, professional accents.
  - Consistent luxury Web3 aesthetic (clean, restrained, no visual clutter).

---

## 4. ESCROW & BLOCKCHAIN TRANSACTIONS
- Never fake, bypass, or silently catch failed on-chain transactions.
- Always provide clear, accurate error states in English.
- Real-time on-chain transparency.
