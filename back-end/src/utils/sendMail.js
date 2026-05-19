import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        // Nếu không có cấu hình SMTP, in OTP ra console để tiện phát triển cục bộ
        if (!user || !pass) {
            console.warn("SMTP credentials not configured. Skipping actual email send.");
            console.log(`DEV OTP for ${email}: ${otp}`);
            return;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || "false") === "true",
            auth: {
                user,
                pass,
            },
            requireTLS: true,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });
        const mailOptions = {
            from: user,
            to: email,
            subject: "Mã OTP xác thực",
            html: ` <h1>Mã OTP của bạn là: ${otp}</h1><p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>`,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email OTP đã được gửi thành công", { messageId: info.messageId, response: info.response });
    } catch (error) {
        console.error("Lỗi khi gửi email OTP:", error);
        // Không ném error để không chặn luồng đăng ký trong môi trường dev nếu mail server gặp vấn đề
        if (process.env.NODE_ENV === "production") throw error;
    }
}