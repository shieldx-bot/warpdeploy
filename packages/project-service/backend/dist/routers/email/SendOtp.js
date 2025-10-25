import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import express from 'express';
import { pool } from '../../database/config.js';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();
const db = pool;
const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        await sendMail(email, otp);
        const sql = `
            insert into VerifyOtp(email, otp ) values ($1, $2)
            `;
        await db.query(sql, [email, otp]);
        res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
    }
    catch (error) {
        console.log("Error sending OTP email:", error);
        res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
    }
});
async function sendMail(email, otp) {
    try {
        const acccessToken = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAth2',
                user: process.env.EMAIL_ADDRESS,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: acccessToken.token,
            }
        });
        const mailOptions = {
            from: `Bạn <${process.env.EMAIL_ADDRESS}>`,
            to: `${email}`,
            subject: "Test gửi Gmail qua OAuth2",
            text: ` Mã OTP của bạn là: ${otp}`,
            html: "<b>Hello world!</b>",
        };
        const result = await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.log(error);
    }
}
export { router, sendMail };
//# sourceMappingURL=SendOtp.js.map