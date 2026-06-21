import Otp from "./otp.model.js";

class AuthRepository {
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
