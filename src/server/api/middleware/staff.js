let staffmodel=require("../models/staff");
const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    if (req.cookies.emstoken != undefined && req.cookies.emstoken != "") {
      const token = req.cookies.emstoken;
      
      const data = jwt.verify(token, "aabb");
      let staff= await staffmodel.findOne({ email: data.token });
      
      if (!staff) return res.status(403).json({ msg: "User not found" });
      req.staff = staff;
      return next();
    } else {
      return res.status(401).json({ success: false, msg: "Please login first" });
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError || err instanceof jwt.NotBeforeError) {
      res.clearCookie("emstoken", { path: "/" });
      return res.status(401).json({
        success: false,
        msg: "Staff session is invalid or expired. Please log in again.",
      });
    }

    console.error("Staff authentication error:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      msg: "Unable to authenticate staff.",
    });
  }
}

module.exports = auth;
