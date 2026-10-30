const express = require("express");
const router = express.Router();
const auth=require("../middleware/staff");
const auths=require("../middleware/admission");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { create,view,submission, viewsubmission, assfeedback,viewassfeedback, findSubmissionById, studentViewSubmission } = require("../controller/assignmentcontroller");


const uploadsDir = path.join(__dirname, "../public/uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true }); 
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const assignmentFileTypes = {
  ".pdf": ["application/pdf"],
  ".txt": ["text/plain"],
  ".csv": ["text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"],
  ".tsv": ["text/tab-separated-values", "text/plain"],
  ".md": ["text/markdown", "text/plain"],
  ".rtf": ["application/rtf", "text/rtf", "application/octet-stream"],
  ".doc": ["application/msword", "application/octet-stream"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
  ".odt": ["application/vnd.oasis.opendocument.text", "application/octet-stream"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
  ".ods": ["application/vnd.oasis.opendocument.spreadsheet", "application/octet-stream"],
  ".ppt": ["application/vnd.ms-powerpoint", "application/octet-stream"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"],
  ".odp": ["application/vnd.oasis.opendocument.presentation", "application/octet-stream"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
};

const assignmentFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = assignmentFileTypes[extension];
  if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type. Upload PDF, text, CSV, Word, Excel, PowerPoint, OpenDocument, or JPG/PNG/WEBP files."));
  }
  return cb(null, true);
};

const assignmentUpload = multer({
  storage,
  fileFilter: assignmentFileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});
const submissionUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === ".pdf" && file.mimetype === "application/pdf") {
      return cb(null, true);
    }
    return cb(new Error("Only PDF submissions are allowed."));
  },
  limits: { files: 1 },
});

const handleUpload = (upload, field) => (req, res, next) => {
  upload.single(field)(req, res, error => {
    if (error) {
      return res.status(400).json({
        success: false,
        msg: error.code === "LIMIT_FILE_SIZE"
          ? "The file must be 25 MB or smaller."
          : error.message || "Unable to upload the file.",
      });
    }
    return next();
  });
};

router.post("/create",auth, handleUpload(assignmentUpload, "Assignment"), create);
router.get("/view",auths,view);
router.post("/submission",auths,handleUpload(submissionUpload, "submissionFile"),submission);
router.get("/viewsubmission",auth,viewsubmission);
router.post("/assfeedback",auth,assfeedback);
router.get("/viewassfeedback",auths,viewassfeedback);
router.get("/findSubmissionById/:id",auth,findSubmissionById);
router.get("/studentViewSubmission",auths,studentViewSubmission);
module.exports = router;
