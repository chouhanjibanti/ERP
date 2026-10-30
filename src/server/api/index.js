const path = require("path");
require("dotenv").config({
  path: path.join(process.cwd(), "src", "server", "api", ".env"),
});

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
  ].filter(Boolean),
  methods: ["POST", "GET", "DELETE", "PUT"],
  credentials: true,
}));

app.use("/", require("./router/adminrouter"));
app.use("/", require("./router/staffrouter"));
app.use("/", require("./router/departmentrouter"));
app.use("/", require("./router/salaryrouter"));
app.use("/", require("./router/attendancerouter"));
app.use("/", require("./router/studentattendance"));
app.use("/", require("./router/formrouter"));
app.use("/", require("./router/libraryrouter"));
app.use("/", require("./router/noticerouter"));
app.use("/", require("./router/assignmentrouter"));
app.use("/", require("./router/feedbackrouter"));
app.use("/", require("./router/admission"));
app.use("/", require("./router/reportrouter"));
app.use("/", require("./router/hostelrouter"));
app.use("/", require("./router/transportrouter"));

module.exports = app;
