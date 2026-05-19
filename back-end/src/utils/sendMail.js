import nodemailer from "nodemailer";

// Remove space trong password (rất quan trọng khi deploy Render)
const cleanPass = (pass) => pass?.replace(/\s/g, "");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: cleanPass(process.env.EMAIL_PASS),
    },
});

export const sendOTP = async (email, otp) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️ Missing EMAIL config - DEV MODE");
            console.log(`DEV OTP for ${email}: ${otp}`);
            return true;
        }

        const mailOptions = {
            from: `"Web Fashion" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Mã OTP xác thực tài khoản",
            html: `
                <div style="font-family:Arial;padding:20px">
                    <h2>Xác thực tài khoản</h2>
                    <p>Mã OTP của bạn là:</p>
                    <h1 style="color:#e74c3c">${otp}</h1>
                    <p>Mã có hiệu lực trong 5 phút.</p>
                    <hr/>
                    <small>Không chia sẻ mã này cho bất kỳ ai.</small>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("✅ OTP sent successfully:", info.messageId);

        return true;
    } catch (error) {
        console.error("❌ OTP SEND ERROR:", error.message);

        throw new Error("Không thể gửi OTP email");
    }
};