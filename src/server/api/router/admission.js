let express=require("express");
let auth=require("../middleware/admission");
let auths=require("../middleware/admin");
let authss=require("../middleware/staff");
let router=express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const admissionImagesDir = path.join(__dirname, "../public/images");
fs.mkdirSync(admissionImagesDir, { recursive: true });

let _upload =multer({ 
    storage:multer.diskStorage({
        destination:(req, file, cb)=>{
            cb(null,admissionImagesDir);
        },
        filename:(req,file,cb)=>{
            cb(null, file.originalname);
        }
    })
})

const { admission,admissionlogin,studentprofile,viewstudent,viewbyids,payfee,studentprofile2, updatestudent, updateOwnStudentProfile, updateOwnStudentProfileImage, getStudentProfileImage, viewbyidstudent, deleteadmittedstudent} = require("../controller/admissioncontroller");
const { studentdashboard } = require("../service/admissionservice");
const { requestStudentPasswordReset, resetStudentPassword } = require("../controller/passwordresetcontroller");
const profileImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const validImage = (
            (file.mimetype === "image/jpeg" && [".jpg", ".jpeg"].includes(extension)) ||
            (file.mimetype === "image/png" && extension === ".png") ||
            (file.mimetype === "image/webp" && extension === ".webp")
        );
        if (!validImage) {
            return cb(new Error("Upload a JPG, PNG, or WEBP image."));
        }
        return cb(null, true);
    },
});
const handleProfileImageUpload = (req, res, next) => {
    profileImageUpload.single("image")(req, res, error => {
        if (error) {
            return res.status(400).json({
                success: false,
                msg: error.code === "LIMIT_FILE_SIZE"
                    ? "Profile image must be 5 MB or smaller."
                    : error.message || "Unable to upload profile image.",
            });
        }
        return next();
    });
};
router.post("/admission",admission);
router.post("/admin/admission",auths,admission);
router.post("/staff/admission",authss,admission);
router.post("/admissionlogin",admissionlogin);
router.get("/studentlogout",(req,res)=>{
    res.clearCookie("token",{path:"/"});
    return res.status(200).json({success:true,msg:"Student logged out successfully"});
});
router.post("/student/forgot-password",requestStudentPasswordReset);
router.post("/student/reset-password",resetStudentPassword);
router.get("/admstudentprofile",auth,studentprofile);
router.get("/studentprofile",auth,studentprofile);
router.put("/studentprofile",auth,updateOwnStudentProfile);
router.put("/studentprofile/image",auth,handleProfileImageUpload,updateOwnStudentProfileImage);
router.get("/studentprofile/image",auth,getStudentProfileImage);
router.get("/student/dashboard",auth,studentdashboard);
router.get("/admin/viewstudent",auths,viewstudent);
router.get("/viewstudent",authss,viewstudent);
router.delete("/deletestudent/:id",auths,deleteadmittedstudent);
router.get("/staff/viewbyidstudent/:id",authss,viewbyidstudent);
router.post("/payfees",auth,payfee);
router.get("/viewbyids/:id",viewbyids);
router.get("/studentprofile2",auth,studentprofile2);
router.put("/updatestudent/:id",updatestudent);
router.get("/viewbyidstudent/:id",viewbyidstudent);

module.exports=router;