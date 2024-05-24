// utils/emailSender.js
const transporter = require('../config/email.config');

const sendDeadlineReminder = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = sendDeadlineReminder;
