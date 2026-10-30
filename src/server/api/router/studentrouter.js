let express=require("express");
let auths=require("../middleware/admin");
let auth=require("../middleware/student");
let router=express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const studentImagesDir = path.join(__dirname, "../public/images");
fs.mkdirSync(studentImagesDir, { recursive: true });

let upload =multer({ 
    storage:multer.diskStorage({
        destination:(req, file, cb)=>{
            cb(null,studentImagesDir);
        },
        filename:(req,file,cb)=>{
            cb(null, file.originalname);
        }
    })
})
const { studentregister, studentlogin, studentprofile, studentlogout, viewstudent,deletestudent ,updatestudent, Sviewbyid} = require("../controller/studentcontroller");
router.post("/studentregister",upload.single("image"),studentregister);
router.post("/studentlogin",studentlogin);
router.get("/studentlogout",studentlogout);
router.get("/viewstudent",viewstudent);
router.delete("/deletestudent/:id",auths,deletestudent);
router.put("/updatestudent/:id",upload.single("image"),updatestudent);
router.get("/studentprofile",auth,studentprofile);
router.get("/Sviewbyid/:id",Sviewbyid);

module.exports=router;