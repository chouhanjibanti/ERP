import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowBack } from '@mui/icons-material'
import './CSS/logoutButton.css'
import HomePage from './ErpPages/HomePage'
import AllLogin from './ErpPages/AllLogin'
import AdminLogin from './ErpPages/AdminLogin'
import Dashboard from './ErpPages/Dashboard'
import Stafflogin from './ErpPages/StaffLogin'
import StudentLogin from './ErpPages/StudentLogin'
import ResetPassword from './ErpPages/ResetPassword'
import Logout from './ErpPages/Logout'
import StudentAttendance from './ErpPages/StudentAttendance'
import UpdateStaff from './ErpPages/UpdateStaff'
import UpdateStudent from './ErpPages/UpdateStudent'
import ViewStaff from './ErpPages/ViewStaff'
import ViewStudent from './ErpPages/ViewStudent'
import AddStaff from './ErpPages/AddStaff'
import AddStudent from './ErpPages/AddStudent'
import UpdateDepartment from './ErpPages/UpdateDepartment'
import ViewDepartment from './ErpPages/ViewDepartment'
import DeptRegistration from './ErpPages/DepartRegistration'
import StaffProfile from './ErpPages/StaffProfile'
import StudentDashboard from './ErpPages/StudentDashboard'
import StaffDashboard from './ErpPages/StaffDashboard'
import StudentProfile from './ErpPages/StudentProfile'
import Notices from './ErpPages/Notices'
import ViewNotices from './ErpPages/ViewNotices'
import ViewFeedback from './ErpPages/ViewFeedback'
import ViewBook from './ErpPages/ViewBook'
import UpdateSalary from './ErpPages/UpdateSalary'
import Feedback from './ErpPages/Feedback'
import Test from './ErpPages/Test'
import SalaryRegister from './ErpPages/SalaryRegister'
import AddBook from './ErpPages/AddBook'
import ViewSalary from './ErpPages/ViewSalary'
import ViewAssignment from './ErpPages/ViewAssignment'
import AssFeed from './ErpPages/AssFeed'
import Assignment from './ErpPages/Assignment'
import ViewAssFeed from './ErpPages/ViewAssFeed'
import AssignmentSubmission from './ErpPages/AssignmentSubmission'
import ViewSubmissions from './ErpPages/ViewSubmission'
import StuAttendance from './ErpPages/StuAttendance'
import StaffAttendance from './ErpPages/StaffAttendance'
import Managebook from './ErpPages/Managebook'
import AdminIssuedBooks from './ErpPages/AdminIssuedBooks'
import Admission from './ErpPages/Admission'
import Adminprofile from './ErpPages/Adminprofile'
import FeePayment from './ErpPages/Payfee'
import ViewTest from './ErpPages/viewTest'
import QuizDetails from './ErpPages/Quiz'
import Viewresult from './ErpPages/Viewresult'
import SubjectRegistration from './ErpPages/SubjectRegistration'
import ExamMarksRegistration from './ErpPages/marks'
import RoomAvailabilityComponent from './ErpPages/room'
import Viewroom from './ErpPages/Viewroom'
import HostelRegistrationForm from './ErpPages/hostel'
import BusConditionUpdate from './ErpPages/transportcondition'
import BusConditionView from './ErpPages/transportconditionview'
import DriverDetailsForm from './ErpPages/driverdetail'
import ViewDrivers from './ErpPages/viewdriver'
import AddRoutes from './ErpPages/addroutes'
import ViewRoutes from './ErpPages/viewRoutes'
import TransportRegister from './ErpPages/studenttransportdetails'
import StudentTransportDetails from './ErpPages/stutranviewadmin'
import ViewNoticess from './ErpPages/ViewNotice2'
import StudentTransportDashboard from './ErpPages/StudentTransport'
import StudentFeePortal from './ErpPages/hostelfee'
import DeleteBooks from './ErpPages/ViewBook2'
import ReportCard from './ErpPages/Reportcard'
import UT1ReportCard from './ErpPages/ut1'
import UT2ReportCard from './ErpPages/ut2'
import MidTermReportCard from './ErpPages/midterm'
import FinalReportCard from './ErpPages/final'
import ViewStaffProfile from './ErpPages/viewstaffprofile'
import ProfileStudent from './ErpPages/StudentById'
import LiveTracker from './ErpPages/LiveTracker'
import StudentSubmissions from './ErpPages/StudentSubmissions'

const dashboardRoutes = {
  '/dashboard': '/Dashboard',
  '/staffdashboard': '/StaffDashboard',
  '/studentdashboard': '/StudentDashboard',
}

const dashboardOnlyPaths = new Set(Object.keys(dashboardRoutes))
const pathsWithoutDashboardBack = new Set([
  '/',
  '/register',
  '/alllogin',
  '/adminlogin',
  '/stafflogin',
  '/studentlogin',
  '/resetpassword',
  '/logout',
  ...dashboardOnlyPaths,
])

const staffPagePrefixes = [
  '/staffprofile',
  '/viewsubmission',
  '/assfeed',
  '/assignment',
  '/stuattendance',
  '/staffviewstudents',
  '/subjectregistration',
  '/marks',
  '/test',
  '/staffattendance',
]

const studentPagePrefixes = [
  '/studentprofile',
  '/viewtest',
  '/reportcard',
  '/viewassignment',
  '/viewassfeed',
  '/studenttransportdetails',
  '/studenttransportalldetails',
  '/payfee',
  '/hostelregistration',
  '/hostelfees',
  '/issued',
]

const hasCookie = (name) => document.cookie
  .split(';')
  .some((cookie) => cookie.trim().startsWith(`${name}=`))

function DashboardBackButton() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname.toLowerCase()
  const rememberedDashboard = sessionStorage.getItem('dashboardPath')
  const dashboardPath = dashboardRoutes[currentPath]

  useEffect(() => {
    if (dashboardPath) {
      sessionStorage.setItem('dashboardPath', dashboardPath)
    }
  }, [dashboardPath])

  if (pathsWithoutDashboardBack.has(currentPath)) return null

  const fallbackDashboard = staffPagePrefixes.some((prefix) => currentPath.startsWith(prefix))
    ? '/StaffDashboard'
    : studentPagePrefixes.some((prefix) => currentPath.startsWith(prefix))
      ? '/StudentDashboard'
      : hasCookie('emstoken')
        ? '/StaffDashboard'
        : hasCookie('token')
          ? '/StudentDashboard'
          : '/Dashboard'

  const targetDashboard = rememberedDashboard || fallbackDashboard

  return (
    <button
      type="button"
      onClick={() => navigate(targetDashboard)}
      aria-label="Back to dashboard"
      style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        zIndex: 1500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 16px',
        border: 0,
        borderRadius: 999,
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #7c3aed 100%)',
        color: '#fff',
        boxShadow: '0 6px 18px rgba(79, 70, 229, 0.32)',
        font: 'inherit',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-2px)'
        event.currentTarget.style.boxShadow = '0 9px 22px rgba(79, 70, 229, 0.4)'
        event.currentTarget.style.filter = 'brightness(1.06)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)'
        event.currentTarget.style.boxShadow = '0 6px 18px rgba(79, 70, 229, 0.32)'
        event.currentTarget.style.filter = 'none'
      }}
    >
      <ArrowBack fontSize="small" />
      Back to Dashboard
    </button>
  )
}

function App() {
  return (
    <BrowserRouter>
        <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/Register' element={<Navigate to="/AllLogin" replace/>}/>
        <Route path='/AllLogin' element={<AllLogin/>}/>
        <Route path='/AdminLogin' element={<AdminLogin/>}/>
        <Route path='/logout' element={<Logout/>}/>
        <Route path='/Dashboard' element={<Dashboard/>}/>
        <Route path='/StaffLogin' element={<Stafflogin/>}/>
        <Route path='/StudentLogin' element={<StudentLogin/>}/>
        <Route path='/ResetPassword' element={<ResetPassword/>}/>
        <Route path='/UpdateStaff/:staffId' element={<UpdateStaff/>}/>
        <Route path='/UpdateStudent/:id' element={<UpdateStudent/>}/>
        <Route path='/ViewStaff' element={<ViewStaff/>}/>
        <Route path='/ViewStudent' element={<ViewStudent/>}/>
        <Route path='/AddStaff' element={<AddStaff/>}/>
        <Route path='/AddStudent' element={<AddStudent/>}/>
        <Route path='/StaffViewStudents' element={<ViewStudent staffView/>}/>
        <Route path='/StaffAddStudent' element={<AddStudent staffView/>}/>
        <Route path='/StudentAttendance/:id' element={<StudentAttendance/>}/>
        <Route path='/StaffStudentAttendance/:id' element={<StudentAttendance staffView/>}/>
        <Route path='/StaffRegistration' element={<Navigate to="/AllLogin" replace/>}/>
        <Route path='/StudentRegistration' element={<Navigate to="/AllLogin" replace/>}/>
        <Route path='/UpdateDepartment/:deptId' element={<UpdateDepartment/>}/>
        <Route path='/ViewDepartment' element={<ViewDepartment/>}/>
        <Route path='/DeptRegistration' element={<DeptRegistration/>}/>
        <Route path='/StaffProfile' element={<StaffProfile/>}/>
        <Route path='/StudentDashboard' element={<StudentDashboard/>}/>
        <Route path='/StaffDashboard' element={<StaffDashboard/>}/>
        <Route path='/StudentProfile' element={<StudentProfile/>}/>
        <Route path='/Notice' element={<Notices/>}/>
        <Route path='/ViewNotices' element={<ViewNotices/>}/>
        <Route path='/ViewFeedback' element={<ViewFeedback/>}/>
        <Route path='/AddBook' element={<AddBook/>}/>
        <Route path='/ViewBook' element={<ViewBook/>}/>
        <Route path='/UpdateSalary/:salaryId' element={<UpdateSalary/>}/>
        <Route path='/Test' element={<Test/>}/>
        <Route path='/SalaryRegistration' element={<SalaryRegister/>}/>
        <Route path='/Feedback' element={<Feedback/>}/>
        <Route path='/ViewSalary' element={<ViewSalary/>}/>
        <Route path='/AssFeed/:submissionId' element={<AssFeed/>}/>
        <Route path='/Assignment' element={<Assignment/>}/>
        <Route path='/ViewAssFeed' element={<ViewAssFeed/>}/>
        <Route path='/AssignmentSubmission/:assignmentId' element={<AssignmentSubmission/>}/>
        <Route path='/ViewSubmission' element={<ViewSubmissions/>}/>
        <Route path='/ViewAssignment' element={<ViewAssignment/>}/>
        <Route path='/StuAttendance' element={<StuAttendance/>}/>
        <Route path='/StaffAttendance' element={<StaffAttendance/>}/>
        <Route path='/StaffAttendance/:staffId' element={<StaffAttendance/>}/>
        <Route path='/issued' element={<Managebook/>}/>
        <Route path='/AdminIssuedBooks' element={<AdminIssuedBooks/>}/>
        <Route path='/Admission' element={<Admission/>}/>
        <Route path='/Adminprofile' element={<Adminprofile/>}/>
        <Route path='/payfee' element={<FeePayment/>}/>
        <Route path='/Managebook' element={<Managebook/>}/>
        <Route path='/viewTest' element={<ViewTest/>}/>
        <Route path="/view-test/:title" element={<QuizDetails />} />
        <Route path='/viewresult/:title' element={<Viewresult/>}/>
        <Route path='/SubjectRegistration' element={<SubjectRegistration/>}/>
        <Route path='/marks' element={<ExamMarksRegistration/>}/>  
        <Route path='/addroom' element={<RoomAvailabilityComponent/>}/>
        <Route path='/Viewroom' element={<Viewroom/>}/>
        <Route path='/hostelregistration' element={<HostelRegistrationForm/>}/> 
        <Route path='/busconditionupdate' element={<BusConditionUpdate/>}/>
        <Route path='/busconditionview' element={<BusConditionView/>}/>
        <Route path='/driverdetail' element={<DriverDetailsForm/>}/>
        <Route path='/driverdetailview' element={<ViewDrivers/>}/>
        <Route path='/addroute' element={<AddRoutes/>}/>
        <Route path='/viewroutes' element={<ViewRoutes/>}/>
        <Route path='/studenttransportdetails' element={<TransportRegister/>}/>
        <Route path='/viewallstudenttransport' element={<StudentTransportDetails/>}/>
        <Route path='/ViewNotice2' element={<ViewNoticess/>}/>
        <Route path='/StudentTransportAllDetails' element={<StudentTransportDashboard/>}/>
        <Route path='/hostelfees' element={<StudentFeePortal/>}/>
        <Route path='/ViewBook2' element={<DeleteBooks/>}/>
        <Route path='/reportcard' element={<ReportCard/>}/>
        <Route path='/ut1' element={<UT1ReportCard/>}/>
        <Route path='/ut2' element={<UT2ReportCard/>}/>
        <Route path='/midterm' element={<MidTermReportCard/>}/>
        <Route path='/final' element={<FinalReportCard/>}/>
        <Route path='/viewbyidstaff/:staffId' element={<ViewStaffProfile/>}/>
        <Route path='/ProfileStudent/:id' element={<ProfileStudent/>}/>
        <Route path='/StaffStudentProfile/:id' element={<ProfileStudent staffView/>}/>
        <Route path='/liveTracker' element={<LiveTracker/>}/>
        <Route path='/sviewsubmission' element={<StudentSubmissions/>}/>
        </Routes>
        <DashboardBackButton />
    </BrowserRouter>
  );
}

export default App
