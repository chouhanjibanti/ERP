let stumodel=require("../models/admission");
const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    if (req.cookies.token != undefined && req.cookies.token != "") {
      const token = req.cookies.token;
      const data = jwt.verify(token, "aabb");
      let adm = await stumodel.findOne({ email: data.token });
      
      if (!adm) return res.status(403).json({ msg: "student not found" });
      req.adm = adm;
      return next();
    } else {
      return res.status(401).json({ success: false, msg: "Please login first" });
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError || err instanceof jwt.NotBeforeError) {
      res.clearCookie("token", { path: "/" });
      return res.status(401).json({
        success: false,
        msg: "Student session is invalid or expired. Please log in again.",
      });
    }

    console.error("Student authentication error:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      msg: "Unable to authenticate student.",
    });
  }
}

module.exports = auth;
