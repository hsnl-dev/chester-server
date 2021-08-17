const express = require('express');
const moment = require('moment');
const crypto = require('crypto');
const {v4: uuidv4} = require('uuid');

const UserModel = require('../models/UserModel');
const PartnerModel = require('../models/PartnerModel');
const sendEmail = require('../utils/sendEmail');
const auth = require('../middlewares/auth');

const router = express.Router();
const userModel = new UserModel();
const partnerModel = new PartnerModel();
const BASE_URL = "http://localhost:3000";

router.get('/', auth, async(req, res, next) => {
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const members = await partnerModel.getPartnerMembers(partner.partner_id);
  let member_arr = [];
  for (let i = 0; i < members.length; i++) {
    const user = await userModel.getUserById(members[i].user_id);
    const data = {
      user_id: user.id,
      role: user.role,
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email,
      activate: user.activate
    }
    member_arr.push(data);
  }
  const partner_data = await partnerModel.getPartnerData(partner.partner_id);
  const result = {
    members: member_arr,
    partner: partner_data
  }
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send("Get member failed");
  }
});

router.get('/roles', auth, async(req, res, next) => {
  console.log(req.user_id);
  const user = await userModel.getUserById(req.user_id);
  res.status(200).send(user.role.toString());
});

router.post('/signin', async(req, res, next) => {
  const {username, password} = req.body;
  const generatedToken = 
    Buffer.from(uuidv4()).toString('base64') + 
    Buffer.from(uuidv4()).toString('base64') + 
    Buffer.from(uuidv4()).toString('base64') + 
    Buffer.from(uuidv4()).toString('base64');
  const expireTime = moment()
    .add(1, 'months')
    .format('YYYY-MM-DD HH:mm:ss');
  const user = await userModel.validAccount(username, password);
  if (user) {
    const isActivate = await userModel.isActivate(user.id);
    if (isActivate) {
      const success = await userModel.addAccessToken({
        user_id: user.id,
        token: generatedToken,
        expireAt: expireTime,
      });
      if (success) {
        res.status(200).send({
          access_token: generatedToken,
          expire_at: expireTime,
        });
      } else {
        res.status(400).send('Add access token failed');
      }
    } else {
      res.status(403).send("User is not activate");
    }
  } else {
    res.status(403).send('登入失敗');
  }
});

router.post('/create', auth, async(req, res, next) => {
  const {username, role, name, phone, email, partner_name, partner_phone, food_industry_id, address, note} = req.body;
  /* role: 1 (partner) => create user => create partner */
  /* role: 2 (clerk)  => create user => add member */
  console.log("email: ", email);
  /* 確認 email 可用 => create user */
  const isEmailExist =  await userModel.existEmail(email);
  if (!isEmailExist) {
    const success = await userModel.createUser({
      username: username,
      role: role,
      name: name,
      phone: phone,
      password: "12345678",
      email: email,
      activate: 1
    });
    if (!success) return res.status(400).send("Create user failed");
    
    const userID = success;
    console.log("userID: ", userID);
    if (role == 1) {  // user is partner => create partner
      const partnerSuccess = await partnerModel.createPartner({
        name: partner_name,
        phone: partner_phone,
        owner_id:  userID,
        food_industry_id: food_industry_id,
        address: address,
        note: note
      });
      if (!partnerSuccess) return res.status(400).send("Create partner failed");
    } else if (role == 2) {   // user is clerk => add member
      const partner = await partnerModel.getPartnerByUserId(req.user_id);
      const addMemberSuccess = await partnerModel.addMember(partner.partner_id, userID, role);
      if (!addMemberSuccess) return res.status(400).send("Add member failed");
    }
    // } else {
    //   console.log("Role ID invalid");
    //   return res.status(400).send("Role ID invalid");
    // }

    // send email
    const randomToken = crypto.randomBytes(32).toString("hex");
    const expireTime = moment()
      .add(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
    const tokenSuccess = await userModel.addResetPasswordToken({
      user_id: userID,
      token: randomToken,
      expireAt: expireTime,
    });

    if (tokenSuccess) {
      const link = `${BASE_URL}/password-reset/${userID}/${randomToken}`;
      const result = await sendEmail(email, "RealFood: Password Reset Link", link);
      if (result) {
        res.status(200).send("Password reset link is sent to your email account");
      } else {
        res.status(403).send("Failed to send email");
      }
    } else {
      console.log("Failed to add password token");
      res.status(400).send('Server error');
    }
  } else {
    res.status(403).send('Email already exist');
  }
}); 

router.post("/:user_id/edit", auth, async (req, res) => {
  const {username, role, name, phone, email, partner_name, partner_phone, food_industry_id, address, note} = req.body;
  const success = await userModel.updateUser({
    user_id: req.params.user_id,
    username: username,
    role: role,
    name: name,
    phone: phone,
    email: email
  });
  if (success) {
    return res.status(200).send("Update user successful");
  } else {
    return res.status(403).send("Update user failed");
  }
});

router.post("/:user_id/deactivate", auth, async (req, res) => {
  const manager_id = req.user_id;
  const manager = await userModel.getUserById(manager_id);
  const manager_partner = await partnerModel.getPartnerByUserId(manager_id);
  const user_partner = await partnerModel.getPartnerByUserId(req.params.user_id);
  if (manager.role > 1 || manager_partner.partner_id !== user_partner.partner_id) {
    return res.status(403).send("Not authorized");
  }
  if (manager.role > 1) {
    return res.status(403).send("Not authorized");
  }
  const success = await userModel.deactivateUser(req.params.user_id);
  if (success) {
    return res.status(200).send("Deactivate user successful");
  } else {
    return res.status(403).send("Deactivate user failed");
  }
});

router.post("/:user_id/activate", auth, async (req, res) => {
  const manager_id = req.user_id;
  const manager = await userModel.getUserById(manager_id);
  const manager_partner = await partnerModel.getPartnerByUserId(manager_id);
  const user_partner = await partnerModel.getPartnerByUserId(req.params.user_id);
  if (manager.role > 1 || manager_partner.partner_id !== user_partner.partner_id) {
    return res.status(403).send("Not authorized");
  }
  const success = await userModel.activateUser(req.params.user_id);
  if (success) {
    return res.status(200).send("Activate user successful");
  } else {
    return res.status(403).send("Activate user failed");
  }
});

router.get("/partner-machines", auth, async (req, res) => {
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const result = await partnerModel.getMachines(partner.partner_id);
  if (result.length > 0) {
    const machines = result.map(function(machine) {
      return {
        "machine_name": machine.machine_name,
        "machine_no": machine.machine_no
      };
    });
    return res.status(200).send(machines);
  } else {
    return res.status(403).send("Fail to get machines");
  }
});

router.post("/add-machines", auth, async (req, res) => {
  const {machine_name, machine_no} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const success = await partnerModel.addMachine({
    partner_id: partner.partner_id,
    machine_name: machine_name,
    machine_no: machine_no
  });
  
  if (success) {
    return res.status(200).send("Add machine successful");
  } else {
    return res.status(403).send("Add machine failed");
  }
});

module.exports = router;
