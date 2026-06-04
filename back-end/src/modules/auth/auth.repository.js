import Session from "./session.model.js";
import Otp from "./otp.model.js";

class AuthRepository {
  // Session methods
  async createSession(sessionData) {
    return await Session.create(sessionData);
  }

  async findSessionByRefreshToken(refreshToken) {
    return await Session.findOne({ refreshToken });
  }

  async deleteSessionByRefreshToken(refreshToken) {
    return await Session.deleteOne({ refreshToken });
  }

  async deleteSessionsByUserId(userId) {
    return await Session.deleteMany({ userId });
  }

  // OTP methods
  async findOtpByEmail(email) {
    return await Otp.findOne({ email });
  }

  async deleteOtpsByEmail(email) {
    return await Otp.deleteMany({ email });
  }

  async deleteOtpByEmail(email) {
    return await Otp.deleteOne({ email });
  }

  async createOtp(otpData) {
    return await Otp.create(otpData);
  }
}

export default new AuthRepository();
