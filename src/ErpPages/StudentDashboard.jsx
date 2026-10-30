import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Drawer, List, ListItemButton, ListItemText, AppBar, Toolbar,
    Typography, IconButton, CssBaseline, Button, Collapse,
    ListItemIcon, Divider, Paper, Grid, Card, CardContent,
    CircularProgress, Alert, useMediaQuery
} from '@mui/material';
import {
    Menu as MenuIcon, School, Assignment, NotificationsOutlined,
    ExpandLess, ExpandMore, AccountCircle, Home, Grading,
    CalendarToday, EmojiObjects,
    Campaign as NoticeIcon, DirectionsBus,
    Payment, Hotel, LocalLibrary, RateReview
} from '@mui/icons-material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format } from 'date-fns';

const drawerWidth = 300;
const primaryColor = '#1e2a38';
const lightBg = '#f4f6f9';
const secondaryColor = '#00bcd4';

const METRIC_COLORS = {
    weeklySales: { icon: EmojiObjects, color: '#4c8bf5', bgColor: 'rgba(76, 139, 245, 0.1)' },
    newUsers: { icon: School, color: '#3ecf8e', bgColor: 'rgba(62, 207, 142, 0.1)' },
    itemOrders: { icon: Grading, color: '#f5b849', bgColor: 'rgba(245, 184, 73, 0.1)' },
    bugReports: { icon: NotificationsOutlined, color: '#f54c7d', bgColor: 'rgba(245, 76, 125, 0.1)' },
};

const MetricCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card
        elevation={0}
        sx={{
            borderRadius: '12px',
            minHeight: 150,
            backgroundColor: bgColor,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-3px)' }
        }}
    >
        <CardContent>
            <Box sx={{ color: color, mb: 1.5, fontSize: 32 }}>
                {React.createElement(Icon, { fontSize: 'inherit' })}
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: color }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: color, opacity: 0.8, mt: 1 }}>
                {title}
            </Typography>
        </CardContent>
    </Card>
);

const ModernCalendarWidget = () => {
    const [value, setValue] = useState(new Date());

    return (
        <Paper elevation={3} sx={{ borderRadius: '16px', p: 1.5, height: 400 }}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 600, px: 1, pt: 1, mb: 1 }}>
                Academic Calendar
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                    value={value}
                    onChange={(newValue) => setValue(newValue)}
                    sx={{
                        width: '100%',
                        '& .MuiPickersCalendarHeader-root': { mb: 0.5, px: 2 },
                        '& .MuiDayCalendar-weekContainer': { px: 1 },
                        '& .MuiDayCalendar-weekDayLabel': { color: secondaryColor, fontWeight: 600 },
                        '& .MuiPickersDay-root': {
                            '&.Mui-selected': { backgroundColor: secondaryColor, color: 'white' },
                            '&:hover': { backgroundColor: '#e0f7fa' }
                        }
                    }}
                />
            </LocalizationProvider>
        </Paper>
    );
};

const CurrentStatusWidget = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = format(currentTime, 'EEEE, MMM do');
    const formattedYear = format(currentTime, 'yyyy');

    return (
        <Paper
            elevation={3}
            sx={{
                borderRadius: '16px',
                p: 3,
                height: 400,
                backgroundColor: secondaryColor,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundImage: `linear-gradient(135deg, ${secondaryColor} 0%, #00838f 100%)`
            }}
        >
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    Current Status
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    {formattedYear}
                </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: 2 }}>
                    {format(currentTime, 'hh:mm')}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {format(currentTime, 'ss a')} IST
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formattedDate}
                </Typography>
            </Box>
        </Paper>
    );
};


const NoticeWidget = ({ notices, loading, error, onViewAll }) => {
    return (
        <Paper
            elevation={3}
            sx={{
                borderRadius: '16px',
                p: { xs: 2, sm: 3 },
                width: '100%',
                height: { xs: 'auto', sm: 400 },
                minHeight: { xs: 390, sm: 400 },
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fff',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NoticeIcon sx={{ color: '#684b83', mr: 1.5, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#594473', fontWeight: 700 }}>
                    Latest Student Notices
                </Typography>
            </Box>
            <Divider sx={{ mb: 1.5, borderColor: '#eee' }} />
            <List
                disablePadding
                sx={{
                    flex: { xs: '0 0 auto', sm: 1 },
                    minHeight: { xs: 'auto', sm: 0 },
                    overflowY: { xs: 'visible', sm: 'auto' },
                    overscrollBehavior: 'contain',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#aaa transparent',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress size={28} sx={{ color: '#815f9b' }} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 1 }}>Notice data is unavailable.</Alert>
                ) : notices.length > 0 ? (
                    notices.map((notice) => {
                        const issueDate = notice.issueDate ? new Date(notice.issueDate) : null;
                        const formattedDate = issueDate && !Number.isNaN(issueDate.getTime())
                            ? format(issueDate, 'dd/MM/yyyy')
                            : 'Date unavailable';

                        return (
                            <Accordion
                                key={notice._id}
                                disableGutters
                                elevation={0}
                                sx={{
                                    borderBottom: '1px solid #eee',
                                    bgcolor: 'transparent',
                                    '&:before': { display: 'none' },
                                    '&:last-of-type': { borderBottom: 'none' },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore sx={{ color: '#815f9b' }} />}
                                    aria-controls={`student-notice-${notice._id}-content`}
                                    id={`student-notice-${notice._id}-header`}
                                    sx={{
                                        px: { xs: 0.5, sm: 1 },
                                        minHeight: 72,
                                        '& .MuiAccordionSummary-content': {
                                            alignItems: 'center',
                                            gap: 1.5,
                                            my: 1.5,
                                            minWidth: 0,
                                        },
                                        '&:hover': { bgcolor: '#faf8fc' },
                                    }}
                                >
                                    <NotificationsOutlined sx={{ color: '#815f9b', fontSize: 20, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography noWrap sx={{ fontWeight: 700, color: '#594473' }}>
                                            {notice.title || 'Untitled notice'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formattedDate}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails
                                    id={`student-notice-${notice._id}-content`}
                                    sx={{ pl: { xs: 5, sm: 6 }, pr: 2, pt: 0, pb: 2 }}
                                >
                                    <Typography variant="body2" sx={{ color: '#666', overflowWrap: 'anywhere' }}>
                                        {notice.content || 'No description available.'}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                ) : (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body2" color="text.secondary">No new notices found.</Typography>
                    </Box>
                )}
            </List>
            <Button
                size="small"
                variant="contained"
                onClick={onViewAll}
                sx={{
                    alignSelf: 'flex-start',
                    mt: 2,
                    bgcolor: '#815f9b',
                    '&:hover': { bgcolor: '#594473' },
                }}
            >
                View All Notices
            </Button>
        </Paper>
    );
};


const StudentDashboard = () => {
    const navigate = useNavigate();
    const [openDrawer, setOpenDrawer] = useState(false);
    const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
    const isMobile = useMediaQuery('(max-width:899px)');
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const [dashboard, setDashboard] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState('');
    const [studentProfile, setStudentProfile] = useState(null);

    const [openAcademics, setOpenAcademics] = useState(false);
    const [openTransport, setOpenTransport] = useState(false);
    const [openLibrary, setOpenLibrary] = useState(false);
    const [openHostel, setOpenHostel] = useState(false);

    const navigateTo = (route) => { navigate(route); };
    const toggleDrawer = () => {
        if (isMobile) {
            setOpenDrawer((open) => !open);
            return;
        }

        setDesktopDrawerOpen((open) => !open);
    };
    const toggleAcademics = () => setOpenAcademics(!openAcademics);
    const toggleTransport = () => setOpenTransport(!openTransport);
    const toggleLibrary = () => setOpenLibrary(!openLibrary);
    const toggleHostel = () => setOpenHostel(!openHostel);
    useEffect(() => {
        let active = true;
        const loadStudentProfile = async () => {
            try {
                const response = await axios.get('/api/studentprofile', {
                    withCredentials: true,
                });
                if (active) setStudentProfile(response.data.student || null);
            } catch (profileError) {
                if (profileError.response?.status !== 401) {
                    console.error('Error fetching student profile for dashboard:', profileError);
                }
            }
        };

        loadStudentProfile();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const response = await axios.get('/api/student/dashboard', {
                    withCredentials: true,
                });
                setDashboard(response.data.dashboard);
            } catch (error) {
                setDashboardError(error.response?.data?.msg || 'Unable to load dashboard data.');
            } finally {
                setDashboardLoading(false);
            }
        };

        loadDashboard();
    }, []);

    useEffect(() => {
        const scriptId = 'noupe-embed-script';
        const scriptUrl = 'https://www.noupe.com/embed/019b3ce8eb9373fbbd8c28bfada2fa47808e.js';

        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = scriptUrl;
            script.async = true;
            document.body.appendChild(script);

            return () => {
                const existingScript = document.getElementById(scriptId);
                if (existingScript) {
                    document.body.removeChild(existingScript);
                }
            };
        }
    }, []); 

    const menuItems = [
        { text: "Dashboard", icon: <Home />, path: '/StudentDashboard', alwaysOpen: true },
        { text: "Student Profile", icon: <AccountCircle />, path: '/StudentProfile' },
        { text: "View Notices", path: '/ViewNotices', icon: <NotificationsOutlined /> },

        {
            text: "Academics",
            icon: <Assignment />,
            onClick: toggleAcademics,
            open: openAcademics,
            subItems: [
                { text: "View Tests", path: '/viewTest' },
                { text: "View Report Card", path: '/reportcard' },
                { text: "View Assignments", path: '/ViewAssignment' },
                { text: "Assign Feedback", path: '/ViewAssFeed' },
            ]
        },

        {
            text: "Transport",
            icon: <DirectionsBus />,
            onClick: toggleTransport,
            open: openTransport,
            subItems: [
                { text: "Add Transport Details", path: '/studenttransportdetails' },
                { text: "Student Transport Details", path: '/StudentTransportAllDetails'},
                { text: "Live Tracking", path: '/liveTracker' }
            ]
        },
        { text: "Fee Payment", icon: <Payment />, path: '/payfee' },

        {
            text: "Hostel Registration",
            icon: <Hotel />,
            onClick: toggleHostel,
            open: openHostel,
            subItems:[
                {text:"Add Hostel Details", path:'/hostelregistration'},
                {text:"Hostel Fees Payment",path:'/hostelfees'},
            ]
        },

        {
            text: "Library",
            icon: <LocalLibrary />,
            onClick: toggleLibrary,
            open: openLibrary,
            subItems:[
                {text:"View Books", path:'/ViewBook'},
                {text:"Issued Books",path:'/issued'},
            ]
        },
        { text: "Feedback", path: '/Feedback', icon: <RateReview /> },
    ];

    const weeklyActivity = Array.isArray(dashboard?.weeklyActivity)
        ? dashboard.weeklyActivity
        : [];
    const hasAttendanceData = weeklyActivity.some((item) => Number.isFinite(item.attendance));
    const assignmentStatus = Array.isArray(dashboard?.assignmentStatus)
        ? dashboard.assignmentStatus
        : [];
    const hasAssignmentData = assignmentStatus.some((item) => Number(item.value) > 0);

    return (
        <Box sx={{ display: "flex", minHeight: '100dvh', overflowX: 'clip' }}>
            <CssBaseline />

            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor: 'white',
                    color: primaryColor,
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Toolbar sx={{ gap: { xs: 0.5, sm: 1.5 }, px: { xs: 1, sm: 2 } }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label={isMobile
                            ? (openDrawer ? 'Close navigation menu' : 'Open navigation menu')
                            : (desktopDrawerOpen ? 'Hide navigation menu' : 'Show navigation menu')}
                        aria-expanded={isMobile ? openDrawer : desktopDrawerOpen}
                        onClick={toggleDrawer}
                        sx={{
                            mr: 0.5,
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#f4f5f7',
                            '&:hover': { bgcolor: '#e9ebef' },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 900, color: secondaryColor }}>
                        EduPulse
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="body2" noWrap sx={{ textAlign: 'right', mr: { xs: 0, sm: 1 }, fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                        Student Dashboard
                    </Typography>
                    <IconButton
                        aria-label="Open student profile"
                        onClick={() => navigateTo('/StudentProfile')}
                        sx={{ color: primaryColor, p: { xs: 0.75, sm: 1 } }}
                    >
                        <AccountCircle />
                    </IconButton>
                    <Button
                        className="dashboard-logout-control"
                        color="inherit"
                        onClick={() => navigateTo('/logout')}
                        sx={{ minWidth: 'auto', px: { xs: 0.75, sm: 1.5 }, py: 0.8, fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={isMobile ? openDrawer : desktopDrawerOpen}
                onClose={() => setOpenDrawer(false)}
                transitionDuration={prefersReducedMotion ? 0 : undefined}
                sx={{
                    width: isMobile || !desktopDrawerOpen ? 0 : drawerWidth,
                    flexShrink: 0,
                    transition: (theme) => theme.transitions.create('width', {
                        duration: theme.transitions.duration.standard,
                        easing: theme.transitions.easing.easeInOut,
                    }),
                    "& .MuiDrawer-paper": {
                        width: { xs: 'min(300px, 85vw)', md: drawerWidth },
                        boxSizing: "border-box",
                        backgroundColor: 'white',
                        color: primaryColor,
                        borderRight: '1px solid #e0e0e0',
                        top: { xs: '56px', sm: '64px' },
                        height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
                    },
                }}
            >
                <Box
                    component="button"
                    type="button"
                    onClick={() => navigateTo('/StudentProfile')}
                    aria-label="Open student profile"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: 'calc(100% - 32px)',
                        mx: 2,
                        mt: 2,
                        mb: 1,
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        bgcolor: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: lightBg },
                    }}
                >
                    <Avatar
                        src={studentProfile?.hasProfileImage ? '/api/studentprofile/image' : undefined}
                        alt={studentProfile?.name ? `${studentProfile.name} profile` : 'Student profile'}
                        sx={{ width: 44, height: 44, mr: 1.5, bgcolor: '#e0f7fa', color: secondaryColor }}
                    >
                        <AccountCircle />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ color: primaryColor, fontWeight: 700, fontSize: '0.95rem' }}>
                            {studentProfile?.name || 'Student User'}
                        </Typography>
                        <Typography noWrap variant="caption" sx={{ color: '#777' }}>
                            Student
                        </Typography>
                    </Box>
                </Box>
                <List onClick={() => { if (isMobile) setOpenDrawer(false); }}>
                    {menuItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <ListItemButton
                                onClick={item.path ? () => navigateTo(item.path) : item.onClick}
                                sx={{
                                    py: 1.5,
                                    transition: 'background-color 0.2s',
                                    '&:hover': { backgroundColor: lightBg },
                                    ...(item.path === '/' && { backgroundColor: lightBg, color: primaryColor, fontWeight: 700 })
                                }}
                            >
                                <ListItemIcon sx={{ color: item.path === '/' ? primaryColor : '#888' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { fontWeight: item.path === '/' ? 700 : 500, fontSize: '0.95rem' } }} />
                                {item.subItems && (item.open ? <ExpandLess sx={{ color: primaryColor }}/> : <ExpandMore sx={{ color: '#888' }}/>)}
                            </ListItemButton>
                            {item.subItems && (
                                <Collapse in={item.open} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {item.subItems.map((subItem, subIndex) => (
                                            <ListItemButton key={subIndex} sx={{ pl: 4, py: 1, '&:hover': { backgroundColor: '#f0f0f0' } }} onClick={() => navigateTo(subItem.path)}>
                                                <ListItemText primary={subItem.text} sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', color: '#666' } }} />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 2, md: 3 },
                    pb: { xs: 4, sm: 2, md: 3 },
                    mt: { xs: '56px', sm: '64px' },
                    minHeight: { xs: 'calc(100dvh - 56px)', md: 'auto' },
                    backgroundColor: lightBg,
                    overflowY: 'visible',
                    overflowX: 'clip',
                    minWidth: 0,
                }}
            >
                {dashboardError && <Alert severity="error" sx={{ mb: 2 }}>{dashboardError}</Alert>}
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
                                <MetricCard title="Attendance this week" value={dashboardLoading ? '...' : dashboardError || dashboard?.attendanceRate == null ? '—' : `${dashboard.attendanceRate}%`} icon={METRIC_COLORS.weeklySales.icon} color={METRIC_COLORS.weeklySales.color} bgColor={METRIC_COLORS.weeklySales.bgColor} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
                                <MetricCard title="Assessments with scores" value={dashboardLoading ? '...' : dashboardError ? '—' : dashboard?.assessmentsWithScores ?? 0} icon={METRIC_COLORS.newUsers.icon} color={METRIC_COLORS.newUsers.color} bgColor={METRIC_COLORS.newUsers.bgColor} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
                                <MetricCard title="Assignments due this week" value={dashboardLoading ? '...' : dashboardError ? '—' : dashboard?.dueThisWeek ?? 0} icon={METRIC_COLORS.itemOrders.icon} color={METRIC_COLORS.itemOrders.color} bgColor={METRIC_COLORS.itemOrders.bgColor} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minWidth: 0 }}>
                                <MetricCard title="Assignments submitted" value={dashboardLoading ? '...' : dashboardError ? '—' : dashboard?.submittedAssignments ?? 0} icon={METRIC_COLORS.bugReports.icon} color={METRIC_COLORS.bugReports.color} bgColor={METRIC_COLORS.bugReports.bgColor} />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid size={12}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, lg: 6 }} sx={{ minWidth: 0 }}>
                                <Paper elevation={1} sx={{ borderRadius: '12px', p: { xs: 2, sm: 3 }, height: { xs: 360, sm: 400 }, width: '100%', boxSizing: 'border-box' }}>
                                    <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 600, mb: 1 }}>
                                        My Weekly Attendance
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Full: 100% · Half: 50% · Leave: 0%
                                    </Typography>
                                    <Box sx={{ height: { xs: 260, sm: 300 }, width: '100%', minWidth: 0, mt: 1, position: 'relative' }}>
                                        {dashboardLoading ? (
                                            <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <CircularProgress size={28} />
                                            </Box>
                                        ) : dashboardError ? (
                                            <Alert severity="error">Attendance data is unavailable.</Alert>
                                        ) : !hasAttendanceData ? (
                                            <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', px: 2 }}>
                                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                                    No attendance records are available for the last seven days.
                                                </Typography>
                                            </Box>
                                        ) : (
                                        <ResponsiveContainer key={isMobile ? 'mobile-attendance-chart' : 'desktop-attendance-chart'} width="100%" height="100%" debounce={100}>
                                            <LineChart data={weeklyActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                                <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} stroke="#888" tick={{ fontSize: 10 }} tickMargin={8} interval="preserveStartEnd" />
                                                <YAxis width={40} stroke="#888" domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={(value) => `${value * 100}%`} tick={{ fontSize: 10 }} />
                                                <RechartsTooltip formatter={(value) => [`${Math.round(value * 100)}%`, 'Attendance']} />
                                                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                                                <Line type="monotone" dataKey="attendance" name="Attendance" stroke="#4c8bf5" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid size={{ xs: 12, lg: 6 }} sx={{ minWidth: 0 }}>
                                <Paper elevation={1} sx={{ borderRadius: '12px', p: { xs: 2, sm: 3 }, height: { xs: 360, sm: 400 }, width: '100%', boxSizing: 'border-box' }}>
                                    <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 600, mb: 3 }}>
                                        Current Assignments Status
                                    </Typography>
                                    <Box sx={{ height: { xs: 280, sm: 310 }, width: '100%', minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {dashboardLoading ? (
                                            <CircularProgress size={28} />
                                        ) : dashboardError ? (
                                            <Alert severity="error">Assignment data is unavailable.</Alert>
                                        ) : hasAssignmentData ? (
                                            <ResponsiveContainer key={isMobile ? 'mobile-assignment-chart' : 'desktop-assignment-chart'} width="100%" height="100%" debounce={100}>
                                                <PieChart>
                                                    <Pie
                                                        data={assignmentStatus}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="44%"
                                                        outerRadius={isMobile ? 85 : 110}
                                                        fill="#8884d8"
                                                        isAnimationActive={false}
                                                    >
                                                        {assignmentStatus.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip formatter={(value, name, props) => [value, props.payload.name]} />
                                                    <Legend align="center" verticalAlign="bottom" layout="horizontal" wrapperStyle={{ fontSize: '12px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                                                No assignment records are available yet.
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={12}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, lg: 6 }} sx={{ minWidth: 0 }}>
                                <ModernCalendarWidget />
                            </Grid>
                            <Grid size={{ xs: 12, lg: 6 }} sx={{ minWidth: 0 }}>
                                <CurrentStatusWidget />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid size={12} sx={{ display: 'flex', minWidth: 0 }}>
                        <NoticeWidget
                            notices={dashboard?.notices || []}
                            loading={dashboardLoading}
                            error={Boolean(dashboardError)}
                            onViewAll={() => navigateTo('/ViewNotices')}
                        />
                    </Grid>

                </Grid>
            </Box>
        </Box>
    );
};

export default StudentDashboard;