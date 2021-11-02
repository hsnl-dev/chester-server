/*const nodemailer = require("nodemailer");
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
    return null;
  }
};

module.exports = sendEmail;*/

const sendgrid = require('@sendgrid/mail');
const {EMAIL_USERNAME, API_KEY} = require('../config');

const sendEmail = async (email, subject, text) => {
  try {
    sendgrid.setApiKey(API_KEY);

    const msg = {
      to: email, // Change to your recipient
      from: EMAIL_USERNAME, // Change to your verified sender
      subject: subject,
      text: text,
      html: text,
    };

    const result = await sendgrid.send(msg);
    console.log(`Email sent: ${result}`);
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = sendEmail;