/**
 * Vietnamese Phone Number Normalizer & Validator
 *
 * Rules:
 * - Accepts 10 digits starting with 0: 03x, 05x, 07x, 08x, 09x.
 * - Accepts international prefix +84 or 84.
 * - Standard internal storage format: +84xxxxxxxxx (E.164).
 */

const VIETNAM_MOBILE_PREFIXES = [
  // Viettel
  "086", "096", "097", "098", "032", "033", "034", "035", "036", "037", "038", "039",
  // Mobifone
  "089", "090", "093", "070", "079", "077", "076", "078",
  // Vinaphone
  "088", "091", "094", "083", "084", "085", "081", "082",
  // Vietnamobile
  "092", "056", "058", "052",
  // Gmobile
  "099", "059",
  // Itelecom, Wintel
  "087", "055"
];

/**
 * Remove all non-numeric characters except leading '+'
 */
export function cleanPhoneNumber(rawPhone) {
  if (typeof rawPhone !== "string") return "";
  let cleaned = rawPhone.trim().replace(/[\s\-\.\(\)]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = "+" + cleaned.slice(1).replace(/\D/g, "");
  } else {
    cleaned = cleaned.replace(/\D/g, "");
  }
  return cleaned;
}

/**
 * Validate whether a phone number belongs to valid Vietnamese mobile carriers.
 * @param {string} rawPhone
 * @returns {boolean}
 */
export function isValidVietnamesePhone(rawPhone) {
  const cleaned = cleanPhoneNumber(rawPhone);
  if (!cleaned) return false;

  // Convert to local 0xxx format for prefix matching
  let localFormat = "";
  if (cleaned.startsWith("+84")) {
    localFormat = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length === 11) {
    localFormat = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 10) {
    localFormat = cleaned;
  } else {
    return false;
  }

  // Must be exactly 10 digits
  if (localFormat.length !== 10) return false;

  const prefix = localFormat.slice(0, 3);
  return VIETNAM_MOBILE_PREFIXES.includes(prefix);
}

/**
 * Normalize Vietnamese phone to E.164 format: +84xxxxxxxxx
 * Throws an Error if invalid.
 * @param {string} rawPhone
 * @returns {string} E.164 phone number
 */
export function normalizeVietnamesePhone(rawPhone) {
  if (!isValidVietnamesePhone(rawPhone)) {
    throw new Error("Số điện thoại không đúng định dạng di động Việt Nam.");
  }

  const cleaned = cleanPhoneNumber(rawPhone);
  if (cleaned.startsWith("+84")) {
    return cleaned;
  }
  if (cleaned.startsWith("84") && cleaned.length === 11) {
    return "+" + cleaned;
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+84" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Mask phone number for public display (e.g., +84 90*** **78)
 * @param {string} phone
 * @returns {string}
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  try {
    const norm = normalizeVietnamesePhone(phone);
    // norm format: +84901234567 (12 chars)
    const country = norm.slice(0, 3); // +84
    const head = norm.slice(3, 5);    // 90
    const tail = norm.slice(-2);      // 67
    return `${country} ${head}*** ***${tail}`;
  } catch {
    // Fallback simple masking
    const len = phone.length;
    if (len <= 4) return "****";
    return phone.slice(0, 3) + "***" + phone.slice(-2);
  }
}

/**
 * Format phone for eSMS API (eSMS requires 0xxxxxxxxx or 84xxxxxxxxx)
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneForEsms(phone) {
  const norm = normalizeVietnamesePhone(phone);
  // remove leading '+'
  return norm.replace(/^\+/, "");
}
