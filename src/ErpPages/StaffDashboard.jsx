import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    Alert, Box, Drawer, List, ListItem, ListItemButton, ListItemText, AppBar, Toolbar, 
    Typography, IconButton, CssBaseline, Button, Collapse, 
    ListItemIcon, Paper, Grid, Container, Avatar, Divider, CircularProgress, useMediaQuery
} from '@mui/material';
import { 
    Menu as MenuIcon, People, Assignment, Notifications, 
    ExpandLess, ExpandMore, AccountCircle, Subject, Home, 
    Grading, Assessment, AccessTime, Campaign, Logout, 
    EventNote, AccessAlarm, School
} from '@mui/icons-material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const drawerWidth = 300; 

const bgColor = '#F4F7FE';
const sidebarBg = '#FFFFFF';
const darkText = '#1B2559'; 
const greyText = '#707EAE';
const brandColor = '#00B5AD';

const StaffDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openDrawer, setOpenDrawer] = useState(true);
    const isMobile = useMediaQuery('(max-width:899px)');
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const [openAssignment, setOpenAssignment] = useState(false);
    const [openStudents, setOpenStudents] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [dashboardData, setDashboardData] = useState(null);
    const [staffProfile, setStaffProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setOpenDrawer(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let active = true;
        const fetchStaffProfile = async () => {
            try {
                const response = await axios.get('/api/staffprofile', { withCredentials: true });
                if (active) setStaffProfile(response.data.profile || null);
            } catch (profileError) {
                if (profileError.response?.status !== 401) {
                    console.error('Error fetching staff profile for dashboard:', profileError);
                }
            }
        };

        fetchStaffProfile();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get('/api/staff/dashboard', {
                    withCredentials: true,
                });
                if (active) setDashboardData(response.data.dashboard);
            } catch (dashboardError) {
                console.error('Error fetching staff dashboard data:', dashboardError);
                if (!active) return;
                if (dashboardError.response?.status === 401) {
                    navigate('/StaffLogin');
                    return;
                }
                setError(dashboardError.response?.data?.msg || 'Failed to load dashboard data. Please try again.');
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchDashboardData();
        return () => { active = false; };
    }, [navigate]);

    const menuItems = [
        { text: "Dashboard", icon: <Home />, path: '/StaffDashboard' },
        { text: "Student Attendance", icon: <AccessTime />, path: '/StuAttendance' },
        { 
            text: "Assignment", icon: <Assignment />, onClick: () => setOpenAssignment(!openAssignment), open: openAssignment, 
            subItems: [
                { text: "Add Assignment", path: '/Assignment' },
                { text: "View Submission", path: '/ViewSubmission' }
            ]
        },
        { text: "View Notices", icon: <Notifications />, path: '/ViewNotices' },
        {
            text: "Student Details",
            icon: <School />,
            onClick: () => setOpenStudents(open => !open),
            open: openStudents,
            subItems: [
                { text: "Add Student", path: '/StaffAddStudent' },
                { text: "View Students", path: '/StaffViewStudents' },
            ],
        },
        { text: "Subject Management", icon: <Subject />, path: '/SubjectRegistration' },
        { text: "Enter Marks", icon: <Grading />, path: '/marks' },
        { text: "Manage Tests", icon: <Assessment />, path: '/Test' },
        { text: "Staff Profile", icon: <AccountCircle />, path: '/StaffProfile' },
    ];

    return (
        <Box sx={{ display: "flex", bgcolor: bgColor, minHeight: "100vh" }}>
            <CssBaseline />
            
            <AppBar position="fixed" sx={{ zIndex: 1400, bgcolor: '#fff', color: darkText, boxShadow: 'none', borderBottom: '1px solid #E0E5F2' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            aria-label={openDrawer ? 'Hide navigation menu' : 'Show navigation menu'}
                            aria-expanded={openDrawer}
                            onClick={() => setOpenDrawer((open) => !open)}
                            sx={{ mr: 2, color: darkText }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: brandColor }}>EduPulse</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', mr: 2 }}>{currentTime}</Typography>
                        <IconButton className="dashboard-logout-control" onClick={() => navigate('/logout')} size="small" sx={{ fontWeight: 800, fontSize: '12px', px: 1.5, py: 0.8 }}><Logout sx={{mr:1}}/>LOGOUT</IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                transitionDuration={prefersReducedMotion ? 0 : undefined}
                sx={{
                    width: isMobile || !openDrawer ? 0 : drawerWidth,
                    flexShrink: 0,
                    transition: (theme) => theme.transitions.create('width', {
                        duration: theme.transitions.duration.standard,
                        easing: theme.transitions.easing.easeInOut,
                    }),
                    "& .MuiDrawer-paper": {
                        width: { xs: 'min(300px, 85vw)', md: drawerWidth },
                        bgcolor: sidebarBg,
                        border: 'none',
                    },
                }}
            >
                <Toolbar />
                <Box
                    component="button"
                    type="button"
                    onClick={() => navigate('/StaffProfile')}
                    aria-label="Open staff profile"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: 'calc(100% - 32px)',
                        mx: 2,
                        mt: 2,
                        p: 1.5,
                        border: '1px solid #E0E5F2',
                        borderRadius: 2,
                        bgcolor: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#F4F7FE' },
                    }}
                >
                    <Avatar
                        src={staffProfile?.image ? `/api/images/${encodeURIComponent(staffProfile.image)}` : undefined}
                        alt={staffProfile?.name ? `${staffProfile.name} profile` : 'Staff profile'}
                        sx={{ width: 44, height: 44, mr: 1.5, bgcolor: '#E1F5FE', color: '#03A9F4' }}
                    >
                        <AccountCircle />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ color: darkText, fontWeight: 700, fontSize: '0.95rem' }}>
                            {staffProfile?.name || 'Staff User'}
                        </Typography>
                        <Typography noWrap variant="caption" sx={{ color: greyText }}>
                            Staff Member
                        </Typography>
                    </Box>
                </Box>
                <List sx={{ px: 3, mt: 4 }} onClick={() => { if (isMobile) setOpenDrawer(false); }}>
                    {menuItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <ListItemButton onClick={item.path ? () => navigate(item.path) : item.onClick} 
                                sx={{ borderRadius: '15px', mb: 1, py: 1.5, bgcolor: location.pathname === item.path ? '#F4F7FE' : 'transparent' }}>
                                <ListItemIcon sx={{ minWidth: 45, color: location.pathname === item.path ? brandColor : darkText }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 800, fontSize: '0.95rem', color: location.pathname === item.path ? darkText : greyText }} />
                                {item.subItems && (item.open ? <ExpandLess /> : <ExpandMore />)}
                            </ListItemButton>
                            {item.subItems && (
                                <Collapse in={item.open} timeout="auto">
                                    <List disablePadding sx={{ pl: 6 }}>
                                        {item.subItems.map((sub, i) => (
                                            <ListItemButton key={i} onClick={() => navigate(sub.path)} sx={{py: 1}}>
                                                <ListItemText primary={sub.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700, color: greyText }} />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: isMobile ? '100%' : undefined, p: { xs: 1.5, sm: 3, md: 4 }, mt: 8 }}>
                <Container maxWidth="xl">
                    <Typography variant="h4" sx={{ fontWeight: 800, color: darkText, mb: 4 }}>Staff Dashboard</Typography>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                    {loading && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><CircularProgress size={20} /><Typography>Loading dashboard data...</Typography></Box>}

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                component="button"
                                type="button"
                                onClick={() => navigate('/StaffViewStudents')}
                                aria-label="View all students"
                                sx={{
                                    p: 3,
                                    width: '100%',
                                    border: 0,
                                    textAlign: 'left',
                                    font: 'inherit',
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                                    '&:focus-visible': { outline: `3px solid ${brandColor}`, outlineOffset: 2 },
                                }}
                            >
                                <Avatar sx={{ bgcolor: '#E1F5FE', color: '#03A9F4', width: 60, height: 60 }}><People fontSize="large" /></Avatar>
                                <Box>
                                    <Typography sx={{ color: greyText, fontWeight: 600 }}>Total Students</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: darkText }}>
                                        {dashboardData?.totalStudents?.toLocaleString() ?? '—'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                component="button"
                                type="button"
                                onClick={() => navigate('/ViewSubmission')}
                                aria-label="View assignment submissions"
                                sx={{
                                    p: 3,
                                    width: '100%',
                                    border: 0,
                                    textAlign: 'left',
                                    font: 'inherit',
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                                    '&:focus-visible': { outline: `3px solid ${brandColor}`, outlineOffset: 2 },
                                }}
                            >
                                <Avatar sx={{ bgcolor: '#FFF3E0', color: '#FF9800', width: 60, height: 60 }}><Assignment fontSize="large" /></Avatar>
                                <Box>
                                    <Typography sx={{ color: greyText, fontWeight: 600 }}>Active Assignments</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: darkText }}>
                                        {dashboardData?.activeAssignments ?? '—'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, borderRadius: '20px', height: 300, overflow: 'auto' }}>
                                <Typography sx={{ fontWeight: 800, mb: 2 }}>Recent Assignment Submissions</Typography>
                                {!dashboardData?.recentSubmissions?.length ? (
                                    <Typography color="text.secondary">
                                        {loading ? 'Loading submissions...' : 'No assignment submissions found.'}
                                    </Typography>
                                ) : dashboardData.recentSubmissions.map((submission) => (
                                    <Box key={submission._id} sx={{ p: 2, mb: 1.5, bgcolor: '#F4F7FE', borderRadius: '12px' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {submission.studentName || 'Student'} — {submission.assignmentTitle}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Submitted {new Date(submission.submissionDate).toLocaleString()}
                                        </Typography>
                                    </Box>
                                ))}
                                <Button fullWidth sx={{ mt: 1, fontWeight: 800 }} onClick={() => navigate('/ViewSubmission')}>
                                    View All Submissions
                                </Button>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, borderRadius: '20px', height: 300, overflow: 'auto' }}>
                                <Typography sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><Campaign color="error"/> Recent Notices</Typography>
                                {!dashboardData?.recentNotices?.length ? (
                                    <Typography color="text.secondary">
                                        {loading ? 'Loading notices...' : 'No notices available.'}
                                    </Typography>
                                ) : dashboardData.recentNotices.map((notice) => (
                                    <Box key={notice._id} sx={{ p: 2, mb: 1.5, bgcolor: '#F4F7FE', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{notice.title || 'Notice'}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {notice.issueDate ? new Date(notice.issueDate).toLocaleDateString() : ''}
                                            </Typography>
                                        </Box>
                                        {notice.type && <Typography variant="caption" sx={{ color: brandColor, fontWeight: 800 }}>{notice.type}</Typography>}
                                    </Box>
                                ))}
                                <Button fullWidth sx={{ mt: 1, fontWeight: 800 }} onClick={() => navigate('/ViewNotices')}>View All</Button>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, borderRadius: '20px', height: 300 }}>
                                <Typography sx={{ fontWeight: 800, mb: 2 }}>Weekly Activity Trends</Typography>
                                <ResponsiveContainer width="100%" height="80%">
                                    <AreaChart data={dashboardData?.weeklyActivity || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip labelFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString()} />
                                        <Area type="monotone" dataKey="attendance" name="Attendance Records" stroke={brandColor} fill={brandColor} fillOpacity={0.1} strokeWidth={3} />
                                        <Area type="monotone" dataKey="submissions" name="Assignment Submissions" stroke="#FF9800" fill="#FF9800" fillOpacity={0.08} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 3, borderRadius: '20px', minHeight: 200, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-evenly', gap: 3 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <AccessAlarm sx={{ fontSize: 42, color: brandColor }} />
                                    <Typography variant="h3" sx={{ fontWeight: 900, color: darkText }}>{currentTime}</Typography>
                                    <Typography variant="h6" sx={{ color: greyText, fontWeight: 700, mt: 1 }}>
                                        {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Typography>
                                </Box>
                                <Divider orientation={isMobile ? 'horizontal' : 'vertical'} flexItem />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, maxWidth: 600 }}>
                                    <EventNote color="action" />
                                    <Typography sx={{ fontWeight: 700 }}>
                                        {dashboardData?.nextEvent
                                            ? `Next Event: ${dashboardData.nextEvent.title || 'Event'} — ${new Date(dashboardData.nextEvent.eventDate).toLocaleString()}`
                                            : loading ? 'Loading upcoming events...' : 'No upcoming events'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
};

export default StaffDashboard;