# TRACKING MASTER EXECUTION PLAN: USER BEHAVIOR TRACKING (A TO Z)
## Project: REACT-WebFashion (404 Studio)
## Status: 100% COMPLETED & VERIFIED (Phases 00-11)
## Verification Date: 31/10/2026

---

## I. SUMMARY OF PHASES & ACCEPTANCE MATRIX

| Phase | Description | Status | Deliverables & Verified Components |
| :--- | :--- | :---: | :--- |
| **Phase 00** | Resource Guard & Baseline Isolation | **VERIFIED** | [RESOURCE_ISOLATION.md](file:///D:/Project/REACT-WebFashion/docs/tracking/RESOURCE_ISOLATION.md), `back-end/src/scripts/verify-resources.js` |
| **Phase 01** | Tracking Architecture Audit | **VERIFIED** | [TRACKING_ARCHITECTURE.md](file:///D:/Project/REACT-WebFashion/docs/tracking/TRACKING_ARCHITECTURE.md), Unified `/api/events` & `/api/tracking` routes |
| **Phase 02** | Event Taxonomy & Canonical Data Contract | **VERIFIED** | [EVENT_TAXONOMY.md](file:///D:/Project/REACT-WebFashion/docs/tracking/EVENT_TAXONOMY.md), `tracking.constants.js`, `tracking.validator.js` |
| **Phase 03** | Complete Frontend Tracking Implementation | **VERIFIED** | `useProductImpression.js` (50% viewport, 500ms dwell), `ProductCard.jsx`, `CustomerChatWidget.jsx` |
| **Phase 04** | Session, Identity Resolution & Consent Lifecycle | **VERIFIED** | `session.service.js` (30m sliding window), `consent.service.js`, `mergeAnonymousToUser` in `auth.controller.js` |
| **Phase 05** | Backend Ingestion, BullMQ Pipeline & Exactly-Once | **VERIFIED** | BullMQ Ingestion Queue, Worker concurrency = 5, Redis 5m Dedup (`sess:prod:dwell`), Spin-lock jitter |
| **Phase 06** | Business Tracking & Order Attribution | **VERIFIED** | Server-Only Order Guard (`purchase_completed` blocked from client), 24h Attribution Window (`resolveOrderAttribution`) |
| **Phase 07** | User Interest Profile & Personalization Scoring | **VERIFIED** | Half-life 14-day exponential decay scoring ($S(t) = W_e \cdot 0.5^{\Delta t / 14}$), Affinity updates, 20 recent products dedup |
| **Phase 08** | Tracking Analytics Engine & Admin Dashboard | **VERIFIED** | [ANALYTICS_METRICS.md](file:///D:/Project/REACT-WebFashion/docs/tracking/ANALYTICS_METRICS.md), ECharts Funnel in `Dashboard.jsx`, Normalized Cohort Funnel |
| **Phase 09** | A/A & A/B Experiment Tracking Hardening | **VERIFIED** | `AA_Recommendation_Validation` in `draft`, Deterministic assignment, SRM Chi-Square validation, Emergency rollback <100ms |
| **Phase 10** | Security, Performance & Resilience Benchmarking | **VERIFIED** | 565 events/s, p50=1.66ms, p95=2.44ms, p99=3.68ms, PII Scrubbing, 500 jobs drained 0 failures |
| **Phase 11** | Automated Testing, Browser E2E & Final Deliverables | **VERIFIED** | [TESTING_EVIDENCE.md](file:///D:/Project/REACT-WebFashion/docs/tracking/TESTING_EVIDENCE.md), [STAGING_RUNBOOK.md](file:///D:/Project/REACT-WebFashion/docs/tracking/STAGING_RUNBOOK.md), [TRACKING_FINAL_ACCEPTANCE_REPORT.md](file:///D:/Project/REACT-WebFashion/docs/tracking/TRACKING_FINAL_ACCEPTANCE_REPORT.md), 114/114 Backend Tests PASS |

---

## II. DETAILED TASK COMPLETION BREAKDOWN

### Phase 00: Resource Guard & Baseline Isolation
- **Task ID**: `TASK-001`
- **Status**: **VERIFIED**
- **Evidence**:
  - Confirmed working directory strictly at `D:\Project\REACT-WebFashion`.
  - MongoDB Atlas database: `test` (30 active collections). Zero cross-database pollution.
  - Redis 6379 key distribution verified exclusively with project prefixes: `bull:*`, `exp:*`, `tracking:*`, `sess:*`, `at:*`, `rt:*`.
  - Script: `back-end/src/scripts/verify-resources.js`.

### Phase 01: Tracking Architecture Audit
- **Task ID**: `TASK-011`
- **Status**: **VERIFIED**
- **Evidence**:
  - Mapped complete data flow: UI Component $\to$ Tracking Client $\to$ Ingestion Route $\to$ BullMQ Queue $\to$ Tracking Worker $\to$ MongoDB Atlas (`userevents`) $\to$ User Interest Profile $\to$ Hybrid Recommendation Engine.
  - Standardized routing: `/api/events` and `/api/tracking` both route to `trackingRouter` and support `/track`, `/batch`, `/consent`, `/analytics/overview`, `/analytics/funnel`.

### Phase 02: Event Taxonomy & Data Contract
- **Task ID**: `TASK-021`
- **Status**: **VERIFIED**
- **Evidence**:
  - Full taxonomy documented in [EVENT_TAXONOMY.md](file:///D:/Project/REACT-WebFashion/docs/tracking/EVENT_TAXONOMY.md).
  - Backward compatibility aliases implemented for `event_name` $\to$ `event_type`, `created_at` / `createdAt` $\to$ `timestamp`, `checkout_start` $\to$ `checkout_started`, `purchase_done` $\to$ `purchase_completed`.
  - Zod validation in `tracking.validator.js` enforces schema types and rejects unknown extra fields.

### Phase 03: Complete Frontend Tracking Implementation
- **Task ID**: `TASK-031`
- **Status**: **VERIFIED**
- **Evidence**:
  - `useProductImpression.js`: 50% visibility threshold + 500ms dwell time debounce.
  - `ProductCard.jsx`: Emits `trackSearchResultClick` when `search_query` is provided in metadata.
  - `ProductGrid.jsx` & `ProductSearch/index.jsx`: Passes `searchTerm` to enable search-to-click conversion tracking and emits `semantic_search_used`.
  - `CustomerChatWidget.jsx`: Emits `ai_recommendation_clicked` on clicking AI suggested products.

### Phase 04: Session, Identity Resolution & Consent Lifecycle
- **Task ID**: `TASK-041`
- **Status**: **VERIFIED**
- **Evidence**:
  - `session.service.js`: 30-minute sliding window resets on user interaction; generates UUIDv4 `anonymous_id`.
  - `consent.service.js`: Enforces `granted` / `denied` state locally and syncs with backend `/api/events/consent`.
  - `auth.controller.js`: Triggers `mergeAnonymousToUser` upon registration, login, and Google OAuth to preserve guest interaction history.

### Phase 05: Backend Ingestion, BullMQ Pipeline & Exactly-Once
- **Task ID**: `TASK-051`
- **Status**: **VERIFIED**
- **Evidence**:
  - Async queue ingestion: Client receives `200 OK` in <2ms while job is queued to BullMQ.
  - Worker concurrency configured to 5 with exponential backoff retry.
  - Redis key deduplication (`sess:prod:dwell`) prevents duplicate product views/clicks within 5 minutes ($300\text{s}$).
  - Distributed spin-locking with random jitter prevents race conditions during profile updates.

### Phase 06: Business Tracking & Order Attribution
- **Task ID**: `TASK-061`
- **Status**: **VERIFIED**
- **Evidence**:
  - Server-Only Event Protection: Client requests attempting to send `purchase_completed`, `purchase`, `order_placed`, `order_cancelled` are rejected with `400 Bad Request`.
  - 24-Hour Last-Touch Attribution: `resolveOrderAttribution` matches ordered products against recommendation click keys in Redis (`tracking:attr:click:*`) and flags `attributed_recommendation = true`.

### Phase 07: User Interest Profile & Personalization Scoring
- **Task ID**: `TASK-071`
- **Status**: **VERIFIED**
- **Evidence**:
  - 14-day exponential decay scoring: $S(t) = W_e \cdot (0.5)^{\Delta t / 14}$.
  - Multi-dimensional profiling: Updates category affinities, search keywords (max 50), and tracks recent 20 interacted products for recommendation deduplication.

### Phase 08: Tracking Analytics & Admin Dashboard
- **Task ID**: `TASK-081`
- **Status**: **VERIFIED**
- **Evidence**:
  - Built Tab 3: "Hành vi & Phễu" (`behavior`) in `front-end/src/pages/Admin/Dashboard.jsx`.
  - Unified Normalized Funnel eliminates anomalies (>100% conversion) by locking base cohort denominator.
  - ECharts Conversion Funnel visualizes Step Conversion and Drop-off Rate.
  - KPI summary cards display Rec CTR, AI CTR, Purchase Conversion, Top Viewed Products, and Top Search Queries.

### Phase 09: A/A & A/B Experiment Tracking Hardening
- **Task ID**: `TASK-091`
- **Status**: **VERIFIED**
- **Evidence**:
  - Staging A/A Experiment `AA_Recommendation_Validation` created in `draft` status (50% control_popular vs 50% control_popular).
  - Deterministic CRC32 assignment and Redis sticky caching.
  - SRM Chi-Square validation ($\chi^2 \le 6.635$).
  - Emergency rollback mechanism reverts traffic to fallback algorithm in <100ms.

### Phase 10: Security, Performance & Resilience Benchmarking
- **Task ID**: `TASK-101`
- **Status**: **VERIFIED**
- **Evidence**:
  - Benchmark throughput: 565.3 events/second.
  - Benchmark latency: p50 = 1.66ms, p95 = 2.44ms, p99 = 3.68ms.
  - Security audit: Server-only event injection blocked (100%).
  - PII Sanitization: Email and phone regex filter tested and verified.
  - BullMQ drained 500 jobs with 0 failed jobs.

### Phase 11: Testing, Staging & Acceptance Deliverables
- **Task ID**: `TASK-111`
- **Status**: **VERIFIED**
- **Evidence**:
  - Jest Backend Test Suite: 9/9 Suites passed, 114/114 Tests passed (100%).
  - Vite Frontend Production Build: 4,659 modules transformed in 2.00s with 0 errors.
  - Playwright visual proofs captured across 6 core user journeys.
  - Complete 8-document suite published in `docs/tracking/`.
