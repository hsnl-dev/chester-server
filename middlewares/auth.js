const UserModel = require("../models/UserModel");
const userModel = new UserModel();

module.exports = async (req, res, next) => {
  const bearerToken = req.header("Authorization");
  if (!bearerToken || bearerToken.split(" ")[0] !== "Bearer") {
    res.status(401).send("Access denied");
    return;
  }

  const token = bearerToken.split(" ")[1];
  const result = await userModel.verifyAccessToken(token);
  if (result) {
    req.user_id = result.user_id;
    const user = await userModel.getUserById(result.user_id);
    if (user) req.admin = (user.role === 0) ? true : false;
    next();
  } else {
    res.status(401).send("Invalid token");
  }
};