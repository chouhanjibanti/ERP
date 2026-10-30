let rec = require("../models/admission");
let rec2=require("../models/feemanagement");
let rec4 = require("../models/feeactivity");

let hostel=require('../models/hosteldetail/studentschema');
let jwt = require("jsonwebtoken");
let bct = require("bcryptjs");

let trans=require('../models/transport/studenttransport');
const Assignment = require("../models/assignment");
const Submission = require("../models/asssubmission");
const StudentAttendance = require("../models/studentattendance");
const Marks = require("../models/marks");
const Notice = require("../models/notice");

exports.admission = async (req, res) => {
  try {
    let email = String(req.body.email || "").trim().toLowerCase();
    let name = String(req.body.name || "").trim();
    let password = req.body.password;
    let dob = req.body.dob;
    let contact = req.body.contact === undefined || req.body.contact === "" ? undefined : Number(req.body.contact);
    let city = req.body.city;
    let address = req.body.address;
    let department = String(req.body.departmentId || req.body.department || 'General').trim();
    let basefee = req.body.basefee === undefined || req.body.basefee === "" ? 0 : Number(req.body.basefee);
    let hostel = req.body.hostel || 'No';
    let library = req.body.library || 'No';
    let transport = req.body.transport || 'No';
    let totalfee = req.body.totalfee === undefined || req.body.totalfee === "" ? basefee : Number(req.body.totalfee);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || !name) {
      return res.status(400).json({ success: false, msg: "Enter a name, valid email address, and password." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, msg: "Password must be at least 6 characters." });
    }
    if (!department || !Number.isFinite(basefee) || basefee < 0 || !Number.isFinite(totalfee) || totalfee < 0 ||
        (contact !== undefined && (!Number.isFinite(contact) || contact < 0)) ||
        (dob && Number.isNaN(new Date(dob).getTime()))) {
      return res.status(400).json({ success: false, msg: "Enter a department and valid date, contact, and non-negative fee amounts." });
    }
    
    let hp = await bct.hash(password, 10);
    let exist = await rec.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (exist) {
      return res.status(400).json({ success: false, msg: "student already exist" });
    } else {
      let data = await rec.findOne().sort({ id: -1 }).select("id").lean();
      const id = Number(data?.id || 0) + 1;
      let record = new rec({email: email, password: hp, contact: contact, city: city, name: name, dob: dob, address: address, id: id, department: department, basefee: basefee, hostel: hostel, library: library, transport: transport, totalfee: totalfee});
      let record2 = new rec2({studentId: id, studentName: name, email: email, totalFee: totalfee, quarter1: {fees: (totalfee)/4, status: 'Overdue'}, quarter2: {fees: (totalfee)/4, status: 'Overdue'}, quarter3: {fees: (totalfee)/4, status: 'Overdue'}, quarter4: {fees: (totalfee)/4, status: 'Overdue'}, remainingFee: totalfee});
      await record.save();
      await record2.save();
      return res.status(200).json({ success: true, msg: "student registered successfully" });
    }
  } catch (err) {
    console.error("Admission registration error:", err);
    return res.status(500).json({ success: false, msg: err.message || "Failed to register student" });
  }
};


exports.admissionlogin = async (req, res) => {
  let email = String(req.body.email || "").trim().toLowerCase();
  let password = req.body.password;
    let data = await rec.findOne({ email: email });
  if (!data) {
    return res.status(404).json({ success: false, msg: "student not found" });
  }
    const isPasswordValid = await bct.compare(password, data.password);
    if (isPasswordValid) {
    let token = jwt.sign({ token: data.email }, "aabb", {
      expiresIn: "1d",
    });
    res.cookie("token", token);
    return res.status(200).json({ success: true, msg: "student login successfully",token});
  } else {
    return res.status(400).json({ success: false, msg: "student login failed" });
  }
};


exports.studentprofile = async (req, res) => {
  const adm = await rec.findById(req.adm._id).select("+profileImageContentType");
  if (!adm) {
    return res.status(404).json({ success: false, msg: "Student profile was not found." });
  }
  return res.status(200).json({
      success: true,
      msg: "student profile fetched successfully",
      student: {
        email: adm.email,
        name: adm.name,
        contact: adm.contact,
        address: adm.address,
        id: adm.id,
        city: adm.city,
        dob: adm.dob,
        department:adm.department,
        basefee:adm.basefee,
        totalfee:adm.totalfee,
        remainingFee:adm.remainingFee,
        hasProfileImage:Boolean(adm.profileImageContentType),
      },
    });
};

exports.updateOwnStudentProfile = async (req, res) => {
  const body = req.body || {};
  const allowedFields = ["name", "contact", "city", "address"];
  const providedFields = allowedFields.filter(field => Object.prototype.hasOwnProperty.call(body, field));
  if (providedFields.length === 0) {
    return res.status(400).json({ success: false, msg: "Provide at least one profile field to update." });
  }

  const updates = {};
  for (const field of providedFields) {
    if (typeof body[field] !== "string") {
      return res.status(400).json({ success: false, msg: `Invalid ${field} value.` });
    }

    const value = body[field].trim();
    if (field === "name") {
      if (!value || value.length > 100) {
        return res.status(400).json({ success: false, msg: "Name must be between 1 and 100 characters." });
      }
      updates.name = value;
    } else if (field === "contact") {
      if (value && !/^\d{7,15}$/.test(value)) {
        return res.status(400).json({ success: false, msg: "Contact number must contain 7 to 15 digits." });
      }
      updates.contact = value ? Number(value) : null;
    } else if (field === "city") {
      if (value.length > 100) {
        return res.status(400).json({ success: false, msg: "City must be 100 characters or fewer." });
      }
      updates.city = value;
    } else if (field === "address") {
      if (value.length > 500) {
        return res.status(400).json({ success: false, msg: "Address must be 500 characters or fewer." });
      }
      updates.address = value;
    }
  }

  try {
    const student = await rec.findByIdAndUpdate(req.adm._id, { $set: updates }, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student profile was not found." });
    }

    return res.status(200).json({
      success: true,
      msg: "Student profile updated successfully.",
      student: {
        email: student.email,
        name: student.name,
        contact: student.contact,
        address: student.address,
        id: student.id,
        city: student.city,
        dob: student.dob,
        department: student.department,
        basefee: student.basefee,
        totalfee: student.totalfee,
        remainingFee: student.remainingFee,
      },
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    return res.status(500).json({ success: false, msg: "Unable to update student profile." });
  }
};

exports.updateOwnStudentProfileImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, msg: "Choose an image to upload." });
  }

  const { buffer, mimetype } = req.file;
  const isJpeg = mimetype === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = mimetype === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = mimetype === "image/webp" &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    return res.status(400).json({ success: false, msg: "The selected file is not a valid JPG, PNG, or WEBP image." });
  }

  try {
    const student = await rec.findByIdAndUpdate(req.adm._id, {
      $set: {
        profileImage: buffer,
        profileImageContentType: mimetype,
      },
    }, { new: true });
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student profile was not found." });
    }

    return res.status(200).json({
      success: true,
      msg: "Profile photo updated successfully.",
    });
  } catch (error) {
    console.error("Error saving student profile image:", error);
    return res.status(500).json({ success: false, msg: "Unable to save profile photo." });
  }
};

exports.getStudentProfileImage = async (req, res) => {
  try {
    const student = await rec.findById(req.adm._id).select("+profileImage +profileImageContentType");
    if (!student?.profileImage || !student.profileImageContentType) {
      return res.status(404).json({ success: false, msg: "No profile photo has been uploaded." });
    }

    res.set("Content-Type", student.profileImageContentType);
    res.set("Cache-Control", "private, no-store");
    res.set("X-Content-Type-Options", "nosniff");
    return res.status(200).send(student.profileImage);
  } catch (error) {
    console.error("Error loading student profile image:", error);
    return res.status(500).json({ success: false, msg: "Unable to load profile photo." });
  }
};

exports.studentdashboard = async (req, res) => {
  try {
    const studentId = String(req.adm.id);
    const dateInSchoolTimezone = date => {
      const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    };
    const shiftDate = (date, days) => {
      const shifted = new Date(`${date}T00:00:00.000Z`);
      shifted.setUTCDate(shifted.getUTCDate() + days);
      return shifted.toISOString().slice(0, 10);
    };
    const today = dateInSchoolTimezone(new Date());
    const activityStart = shiftDate(today, -6);
    const activityEnd = today;
    const weekEnd = shiftDate(today, 7);

    const [assignments, submissions, attendance, marks, notices] = await Promise.all([
      Assignment.find().select("_id Title IssueDate SubmissionDate").lean(),
      Submission.find({ studentId }).select("assignId submissionDate").lean(),
      StudentAttendance.find({
        id: Number(req.adm.id),
        date: { $gte: activityStart, $lte: activityEnd },
      }).select("date status").sort({ date: 1 }).lean(),
      Marks.findOne({ studentId }).lean(),
      Notice.find().sort({ issueDate: -1 }).limit(5).select("title content type issueDate eventDate").lean(),
    ]);

    const submittedAssignmentIds = new Set(submissions.map(item => String(item.assignId)));
    const assignmentStatus = { Submitted: 0, Pending: 0, Overdue: 0 };
    let dueThisWeek = 0;
    assignments.forEach(assignment => {
      const isSubmitted = submittedAssignmentIds.has(String(assignment._id));
      if (isSubmitted) {
        assignmentStatus.Submitted += 1;
        return;
      }

      if (!assignment.SubmissionDate) {
        assignmentStatus.Pending += 1;
        return;
      }
      const dueDate = dateInSchoolTimezone(new Date(assignment.SubmissionDate));
      if (dueDate < today) {
        assignmentStatus.Overdue += 1;
      } else {
        assignmentStatus.Pending += 1;
        if (dueDate < weekEnd) dueThisWeek += 1;
      }
    });

    const attendanceByDay = new Map(attendance.map(record => [record.date, record.status]));
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const day = shiftDate(activityStart, index);
      const status = attendanceByDay.get(day);
      return {
        date: day,
        attendance: status === "Full" ? 1 : status === "Half" ? 0.5 : status === "Leave" ? 0 : null,
      };
    });
    const recordedAttendance = attendance.filter(record =>
      ["Full", "Half", "Leave"].includes(record.status)
    );
    const attendanceRate = recordedAttendance.length
      ? Math.round(
        (recordedAttendance.reduce((total, record) =>
          total + (record.status === "Full" ? 1 : record.status === "Half" ? 0.5 : 0), 0
        ) / recordedAttendance.length) * 100
      )
      : null;
    const examKeys = ["ut1", "ut2", "midTerm", "final"];
    const subjects = ["subject1", "subject2", "subject3", "subject4", "subject5", "subject6"];
    const assessmentsWithScores = marks
      ? examKeys.filter(exam => subjects.some(subject => Number(marks[exam]?.[subject]) > 0)).length
      : 0;

    return res.status(200).json({
      success: true,
      dashboard: {
        student: { name: req.adm.name, department: req.adm.department },
        attendanceRate,
        attendanceRecordsThisWeek: recordedAttendance.length,
        assessmentsWithScores,
        dueThisWeek,
        submittedAssignments: assignmentStatus.Submitted,
        assignmentStatus: Object.entries(assignmentStatus).map(([name, value], index) => ({
          name,
          value,
          color: ["#3ecf8e", "#f5b849", "#f54c7d"][index],
        })),
        weeklyActivity,
        notices,
      },
    });
  } catch (error) {
    console.error("Student dashboard data error:", error);
    return res.status(500).json({
      success: false,
      msg: "Unable to load student dashboard data.",
    });
  }
};

exports.viewstudent = async (req, res) => {
  try {
    const studentlist = await rec.find();
    return res.status(200).json({
      success: true,
      msg: studentlist.length === 0 ? "No students found." : "All student details fetched successfully",
      student: studentlist,
    });
  } catch (error) {
    console.error("Error fetching student list:", error);
    return res.status(500).json({ success: false, msg: "Unable to fetch students right now." });
  }
};

exports.deleteadmittedstudent = async (req, res) => {
  try {
    const student = await rec.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student not found." });
    }

    return res.status(200).json({ success: true, msg: "Student deleted successfully." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid student ID." });
    }

    console.error("Error deleting student admission:", error);
    return res.status(500).json({ success: false, msg: "Unable to delete student right now." });
  }
};

exports.payfee = async (req, res) => {
  const quarter = req.body.quarter; 
  console.log("quarter",quarter);
  const studentId = req.adm.id;    
  console.log("studentId",studentId);
  const totalFee = req.adm.totalfee;
  console.log("totalFee",totalFee);
  const amount = totalFee / 4;     

  try {
    let feeRecord = await rec2.findOne({ studentId: studentId });

    if (!feeRecord) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }
    const selectedquarter = feeRecord[quarter];
    selectedquarter.status = 'Paid';
    selectedquarter.fees = amount;
    feeRecord.remainingFee -= amount;
    await feeRecord.save();

    let feeActivity = new rec4({
      studentId: feeRecord.studentId,
      studentName: feeRecord.studentName,
      quarter: quarter,
      amount: amount,
    });

    await feeActivity.save();

    return res.status(200).json({
      success: true,
      msg: `Fee } paid successfully`,
      remainingFee: feeRecord.remainingFee, 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};


exports.studentprofile2 = async (req, res) => {
  console.log("req.adm",req.adm);
  console.log("6")
  let adm=req.adm;
  console.log("adm",adm);
  data=await rec2.findOne({studentId:adm.id});
  console.log("data",data);
  return res
    .status(200)
    .json({
      success: true,
      msg: "student profile fetched successfully",
      student: data,
    });
};


exports.updatestudent = async (req, res) => {
  console.log("hiiii");

  let id = req.params.id;
  let updatedData = req.body;
  let record = await rec.findByIdAndUpdate({ _id: id }, updatedData, {
    new: true,
  });

  if (!record) {
    return res
      .status(404)
      .json({ success: false, msg: "Student not found" });
  }

  console.log(record);

  return res
    .status(200)
    .json({
      success: true,
      msg: "Student updated successfully",
      student: record,
    });
};

exports.viewbyidstudent=async(req,res)=>
{
  try {
    const studentId = req.params.id;
    console.log("Student ID:", studentId);
    let student = await rec.findOne({ _id: studentId });
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }
    return res.status(200).json({
      success: true,
      msg: "Student details fetched successfully",
      student: student,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
}