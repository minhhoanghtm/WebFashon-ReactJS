import nodemailer from "nodemailer";

const buildTransport = (host, port, secure, user, pass) =>
    nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        requireTLS: !secure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });

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

        const mailOptions = {
            from: user,
            to: email,
            subject: "Mã OTP xác thực",
            html: ` <h1>Mã OTP của bạn là: ${otp}</h1><p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>`,
        };

        const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        const transports = [
            buildTransport(smtpHost, Number(process.env.SMTP_PORT || 587), String(process.env.SMTP_SECURE || "false") === "true", user, pass),
            buildTransport(smtpHost, 465, true, user, pass),
        ];

        let lastError = null;
        for (const transporter of transports) {
            try {
                const info = await transporter.sendMail(mailOptions);
                console.log("Email OTP đã được gửi thành công", { messageId: info.messageId, response: info.response });
                return;
            } catch (error) {
                lastError = error;
                console.error("SMTP send attempt failed:", {
                    code: error.code,
                    command: error.command,
                    message: error.message,
                });
            }
        }

        throw lastError || new Error("Không thể gửi OTP qua SMTP");
    } catch (error) {
        console.error("Lỗi khi gửi email OTP:", error);
        // Không ném error để không chặn luồng đăng ký trong môi trường dev nếu mail server gặp vấn đề
        if (process.env.NODE_ENV === "production") throw error;
    }
}