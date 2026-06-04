import nodemailer from "nodemailer";

const cleanPass = (pass) => pass?.replace(/\s/g, "");

export const sendOTP = async (email, otp) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS ? cleanPass(process.env.EMAIL_PASS) : null;

    if (!user || !pass) {
      console.log(`[DEV MODE] OTP for ${email}: ${otp} (SMTP details not configured)`);
      return { messageId: "dev-mock-id" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: user,
      to: email,
      subject: "Mã OTP Xác Thực - Web Fashion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4CAF50; text-align: center;">Mã Xác Thực OTP</h2>
          <p>Xin chào,</p>
          <p>Mã OTP của bạn để hoàn tất đăng ký/reset mật khẩu tại Web Fashion là:</p>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; border-radius: 4px; border: 1px dashed #ccc;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px;">Lưu ý: Mã OTP này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với người khác.</p>
        </div>
      `,
    });

    console.log("✅ EMAIL SENT:", info.messageId);
    return info;
  } catch (err) {
    console.error("🔥 SMTP ERROR:", err);
    throw err;
  }
};
