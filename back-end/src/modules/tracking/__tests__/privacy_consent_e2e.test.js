import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { updateConsentSchema } from "../tracking.validator.js";
import trackingService from "../tracking.service.js";
import { PRIVACY_POLICY_VERSION } from "../../../common/constants/privacyPolicy.js";

describe("Privacy & Consent Management Backend Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Validation & Schema Compliance", () => {
    test("Accepts legacy binary consent 'granted'", () => {
      const payload = { body: { consent: "granted" } };
      const parsed = updateConsentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    test("Accepts legacy binary consent 'denied' with anonymous_id", () => {
      const payload = {
        body: {
          consent: "denied",
          anonymous_id: "a1b2c3d4-e5f6-4a8b-8c0d-1e2f3a4b5c6d",
          anonymous_token: "test-token-123",
        },
      };
      const parsed = updateConsentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    test("Accepts structured categories and choices", () => {
      const payload = {
        body: {
          choice: "CUSTOM",
          categories: {
            necessary: true,
            analytics: false,
            personalization: true,
            marketing: false,
          },
          policyVersion: PRIVACY_POLICY_VERSION,
          anonymous_id: "a1b2c3d4-e5f6-4a8b-8c0d-1e2f3a4b5c6d",
        },
      };
      const parsed = updateConsentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      expect(parsed.data.body.categories.necessary).toBe(true);
      expect(parsed.data.body.categories.analytics).toBe(false);
      expect(parsed.data.body.categories.personalization).toBe(true);
      expect(parsed.data.body.categories.marketing).toBe(false);
    });

    test("Rejects unknown properties (strict mode)", () => {
      const payload = {
        body: {
          choice: "CUSTOM",
          unknown_field: 123,
        },
      };
      const parsed = updateConsentSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("2. Default State Machine & Retrieval", () => {
    test("getConsent returns UNKNOWN and non-essential disabled when no subject exists", async () => {
      const result = await trackingService.getConsent({ userId: null, anonymousId: null });
      expect(result.hasConsented).toBe(false);
      expect(result.necessary).toBe(true);
      expect(result.analytics).toBe(false);
      expect(result.personalization).toBe(false);
      expect(result.marketing).toBe(false);
      expect(result.choice).toBe("UNKNOWN");
      expect(result.status).toBe("denied");
    });
  });

  describe("3. Purpose-specific Logic in updateConsent", () => {
    test("ESSENTIAL_ONLY disables all non-essential and sets status to denied", async () => {
      const anonId = "11111111-2222-4333-8444-555555555555";
      const result = await trackingService.updateConsent({
        anonymousId: anonId,
        choice: "ESSENTIAL_ONLY",
        categories: {
          necessary: true,
          analytics: false,
          personalization: false,
          marketing: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.consent).toBe("denied");
      expect(result.choice).toBe("ESSENTIAL_ONLY");
      expect(result.categories.analytics).toBe(false);
      expect(result.categories.personalization).toBe(false);
      expect(result.categories.marketing).toBe(false);
    });

    test("ALL_ACCEPTED enables non-essential and sets status to granted", async () => {
      const anonId = "22222222-3333-4444-8555-666666666666";
      const result = await trackingService.updateConsent({
        anonymousId: anonId,
        choice: "ALL_ACCEPTED",
        categories: {
          necessary: true,
          analytics: true,
          personalization: true,
          marketing: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.consent).toBe("granted");
      expect(result.choice).toBe("ALL_ACCEPTED");
      expect(result.categories.analytics).toBe(true);
      expect(result.categories.personalization).toBe(true);
    });

    test("CUSTOM choice with only Analytics sets consent status granted", async () => {
      const anonId = "33333333-4444-4555-8666-777777777777";
      const result = await trackingService.updateConsent({
        anonymousId: anonId,
        choice: "CUSTOM",
        categories: {
          necessary: true,
          analytics: true,
          personalization: false,
          marketing: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.consent).toBe("granted");
      expect(result.categories.analytics).toBe(true);
      expect(result.categories.personalization).toBe(false);
    });
  });
});
