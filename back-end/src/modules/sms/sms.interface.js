/**
 * @typedef {Object} SendSmsResult
 * @property {boolean} success - Whether the SMS was dispatched
 * @property {string} [messageId] - Provider message tracking ID
 * @property {string} [error] - Error message if failed
 * @property {string} [code] - Provider error code
 * @property {any} [raw] - Raw response from provider
 */

/**
 * Interface that all SMS providers must implement
 */
export class ISmsProvider {
  /**
   * @param {string} phone - Normalized Vietnamese phone number (+84...)
   * @param {string} text - Message content
   * @param {Object} [meta] - Additional metadata (e.g. purpose, otp, callbackUrl)
   * @returns {Promise<SendSmsResult>}
   */
  async sendSms(phone, text, meta = {}) {
    throw new Error("Method sendSms() must be implemented by provider");
  }
}
