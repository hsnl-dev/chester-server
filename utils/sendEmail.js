const nodemailer = require("nodemailer");
const {EMAIL_USERNAME, EMAIL_PASSWORD} = require('../config');

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.sendinblue.com',
      port: 587,
      auth: {
        user: 'ktgintkd@gmail.com',
        pass: 'xsmtpsib-a6c2efe9808b2e729cb311e98284f6184664eaef0995177393bfaefaec2130e6-2DRM4bZswVEzkOjN',
      }
    });

    const mail_status = await transporter.sendMail({
      from: EMAIL_USERNAME,
      to: email,
      subject: subject,
      text: text
    });

    console.log(`Message sent: ${mail_status.messageId}`);
    return `Message sent: ${mail_status.messageId}`;
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendEmail;