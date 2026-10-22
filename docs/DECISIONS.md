# MiniLedger Architecture & Design Decisions

This document records architectural, design, and technical decisions made during the development of MiniLedger.

---

### ADR-001: Monorepo with npm Workspaces
- **Decision:** Use native npm workspaces with `packages/shared`, `apps/api`, and `apps/mobile`.
- **Rationale:** Keeps Zod schemas strictly shared between backend and mobile without duplicating types or drift. Shared package builds to TypeScript definitions and plain JavaScript for frictionless Metro & Node consumption.

### ADR-002: Money Stored as Integer Paise
- **Decision:** All monetary amounts are strictly stored as integer paise (`amountPaise: Int`), representing 1/100th of ₹1 INR.
- **Rationale:** Floating-point numbers introduce rounding errors in financial computations. Integer paise guarantees lossless, exact arithmetic.

### ADR-003: Overdue Status is Derived Dynamically
- **Decision:** `isOverdue` is never stored in the database. It is derived at query/service time via `status = PENDING AND dueDate < today(Asia/Kolkata)` using an injected `Clock`.
- **Rationale:** Avoids stale database flags and eliminates the need for nightly cron jobs to update flags. Allows backtesting using `FakeClock`.

### ADR-004: Swappable OTP Abstraction with Fallback Decorator
- **Decision:** Define `OtpSender` interface with implementations: `WhatsAppOtpSender`, `ConsoleOtpSender`, `SmsOtpSender` (stub), and `FallbackOtpSender` (decorator).
- **Rationale:** Enables zero-code switching between WhatsApp Cloud API and local console logging. In development and demos, `FallbackOtpSender` ensures that WhatsApp rate limits or delivery issues automatically fall back to console logging so development flow is never interrupted.

### ADR-005: Refresh Token Hashing & Rotation
- **Decision:** Store refresh tokens as SHA-256 hashes in the database. Rotate refresh tokens upon every refresh request.
- **Rationale:** Protects against token theft if the database is compromised. Rotation limits the attack window of intercepted tokens.
