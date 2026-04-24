import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Mã OTP xác thực",
            html: ` <h1>Mã OTP của bạn là: ${otp}</h1><p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>`,
        };
        await transporter.sendMail(mailOptions);
        console.log("Email OTP đã được gửi thành công");
    } catch (error) {
        console.error("Lỗi khi gửi email OTP:", error);
        throw error;
    }
}