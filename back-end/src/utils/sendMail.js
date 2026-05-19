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
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");

        if (!user || !pass) {
            console.log(`DEV OTP: ${otp}`);
            return;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });

        const info = await transporter.sendMail({
            from: user,
            to: email,
            subject: "OTP",
            html: `<h1>${otp}</h1>`,
        });

        console.log("EMAIL SENT:", info.messageId);
        return info;

    } catch (err) {
        console.error("🔥 SMTP REAL ERROR:", err);
        throw err;
    }
};