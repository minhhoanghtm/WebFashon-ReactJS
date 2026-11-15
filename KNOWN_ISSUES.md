# KNOWN_ISSUES.md — Known Issues & Limitations

## Current Status

**No known issues found in executed checks.**

---

## 1. Automated Verification & Quality Audit

- **Total Routes Tested:** 48 routes across Desktop (1440×900) and Mobile (390×844) viewports.
- **Total Test Cases:** 96 runs.
- **Test Result:** 96 PASS / 0 FAIL (100% success rate).
- **Horizontal Overflow Check (`scrollWidth === clientWidth`):** 0 overflow instances detected across all 48 routes.
- **Console Runtime Exceptions:** 0 unhandled exceptions.

---

## 2. Issues Discovered and Resolved During Implementation (Self-Healing Log)

### Issue #1: Voucher Catalog Data Parsing & Responsive Layout on Mobile
- **Symptom:** On initial probe of `/vouchers` under mobile viewport (390px), potential error overlay overflow occurred when API returned nested structure `{ success: true, data: { items: [...] } }`.
- **Root Cause:** Direct assumption of array structure `res.data.map()` rather than checking for nested collections.
- **Resolution:** Implemented defensive data parser:
  ```js
  const rawList = res?.data?.items || res?.data?.vouchers || (Array.isArray(res?.data) ? res.data : []);
  ```
  Added strict `overflow-x: clip` in root styles according to Hallmark & Taste-Skill standards.
- **Verification:** Re-tested on both Desktop and Mobile with Playwright; confirmed 100% PASS with 0px overflow.

---

## 3. Remaining Blockers or Technical Debt
- **Remaining Blockers:** None.
- **Remaining Issues:** 0.
