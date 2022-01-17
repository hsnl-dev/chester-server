const express = require("express");
const moment = require('moment-timezone');
const crypto = require("crypto");
const Joi = require("joi");

const UserModel = require('../models/UserModel');
const sendEmail = require("../utils/sendEmail");
const {BASE_URL} = require('../config');

const router = express.Router();
const userModel = new UserModel();

router.post("/", async(req, res) => {
  const username = req.body.username;
  try {
    const user = await userModel.getUserByUsername(username);
    if (!user) {
      console.log("User not found");
      return res.status(400).send("Email does not belong to any user")
    }
    console.log(user);
    const randomToken = crypto.randomBytes(32).toString("hex");
    const expireTime = moment()
      .add(5, 'minutes')
      .tz("Asia/Taipei")
      .format('YYYY-MM-DD HH:mm:ss');
    const success = await userModel.addResetPasswordToken({
      user_id: user.id,
      token: randomToken,
      expireAt: expireTime,
    });

    if (success) {
      const link = `${BASE_URL}/password-reset/${user.id}/${randomToken}`;
      await sendEmail(user.email, "RealFood: Password Reset Link", link);
      res.status(200).send("Password reset link is sent to your email account");
    } else {
      console.log("Failed to add password token");
      res.status(400).send('Server error');
    }
  } catch (err) {
    console.log(err);
    res.status(403).send("Send link failed");
  }
});

router.post("/:user_id/:token", async (req, res) => {
  const password = req.body.newpassword;
  const userID = req.params.user_id;
  const token = req.params.token;
  try {
    const validToken = await userModel.verifyResetPasswordToken(userID, token);
    if (!validToken) {
      return res.status(400).send("Invalid link");
    }
    console.log(validToken);
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    if (moment(validToken.expire_at).isBefore(currentTime)) {
      console.log(currentTime);
      console.log(moment(validToken.expire_at).format('YYYY-MM-DD HH:mm:ss'));
      return res.status(400).send("Link is expired");
    }
    
    const success = await userModel.resetPassword(userID, password);
    if (success) {
      const success2 = await userModel.removePasswordToken(userID, token);
      const success3 = await userModel.activateUser(userID);
      if (success2 && success3) {
        res.status(200).send("Password reset successfully");
      } else {
        res.status(400).send("Password reset failed");
      }
    } else {
      console.log("Reset password failed");
      res.status(400).send("Password reset failed");
    }
  } catch (err) {
    console.log(err);
    res.status(403).send("Reset password failed")
  }
});

module.exports = router;
