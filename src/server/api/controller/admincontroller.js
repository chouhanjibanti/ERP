const { adminregister, adminlogin, adminprofile, updateAdminProfileImage, adminlogout, updateadmin, dashboard, dashboardAttendance } = require("../service/adminservice");

exports.adminregister=async(req,res)=>
{
 await adminregister(req,res);
}
exports.adminlogin = async (req, res) =>
{
  try {
    await adminlogin(req, res);
  } catch (error) {
    console.error("Admin login error:", error);
    if (res.headersSent) {
      return;
    }
    return res.status(500).json({
      success: false,
      msg: "Unable to complete admin login. Please try again later.",
    });
  }
}
exports.adminprofile=async(req,res)=>
{
 await adminprofile(req,res);
}
exports.updateAdminProfileImage=async(req,res)=>
{
 await updateAdminProfileImage(req,res);
}
exports.adminlogout=async(req,res)=>
{
  await adminlogout(req,res);
}
exports.dashboard=async(req,res)=>
{
  await dashboard(req,res);
}
exports.dashboardAttendance=async(req,res)=>
{
  await dashboardAttendance(req,res);
}