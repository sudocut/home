# Partner Chip Ticker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the homepage trust-band channel cards into fixed-height horizontal partner chips with consistent spacing and seamless large-screen ticker coverage.

**Architecture:** Keep channel data and profile image fallback behavior unchanged. Change `ChannelTicker` from two duplicated `<ul>` tracks to one repeated-cycle track, then update CSS and the browser verifier so geometry, spacing, motion coverage, and duplicate accessibility are executable contracts.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS custom properties, Playwright Core browser verification, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-18-partner-chip-ticker-design.md`

---

### Task 1: Add failing browser contract

**Files:**

- Modify: `tools/verify-channel-browser.mjs`

- [ ] Add assertions for four rendered visual cycles, five keyboard-accessible
      original links, duplicate links removed from tab order, equal item heights,
      square avatar slots, equal start/item/seam gaps, and no blank right edge on
      1728px screens at sampled animation times.
- [ ] Run `pnpm build && pnpm channels:verify-browser`.
- [ ] Expected: FAIL on the current vertical-card implementation.

### Task 2: Implement horizontal partner chips

**Files:**

- Modify: `src/components/ChannelTicker.tsx`
- Modify: `app/globals.css`

- [ ] Render one `.sc-tick-track` with four cycles of the five channels.
- [ ] Mark duplicate cycles `aria-hidden` and set their links to `tabIndex={-1}`.
- [ ] Replace the 16:9 art slot with a square avatar slot in a fixed-height
      horizontal chip.
- [ ] Keep hover/focus pause, reduced motion, channel order, names, handles, and
      links unchanged.

### Task 3: Verify and commit

**Files:**

- Modified files above.

- [ ] Run `pnpm channels:test`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm channels:verify-browser`.
- [ ] Run literal color and font-family guards from `CLAUDE.md`.
- [ ] Commit with `fix: tighten partner channel ticker layout`.

