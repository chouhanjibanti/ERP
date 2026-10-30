import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Alert, Box, Button, Paper, Stack, TextField, Typography
} from '@mui/material';
import { ArrowBack, PersonAddAlt1 } from '@mui/icons-material';
import '../CSS/addaccounts.css';

const initialForm = {
    name: '',
    email: '',
    password: '',
    dob: '',
    contact: '',
    city: '',
    address: '',
    department: '',
    totalfee: '0',
};

const AddStudent = ({ staffView = false }) => {
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleChange = event => {
        setForm(current => ({ ...current, [event.target.name]: event.target.value }));
        setMessage(null);
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const payload = {
            ...form,
            departmentId: form.department.trim(),
            basefee: Number(form.totalfee),
            totalfee: Number(form.totalfee),
            hostel: 'No',
            library: 'No',
            transport: 'No',
        };
        delete payload.department;
        if (!payload.dob) delete payload.dob;
        if (!payload.contact) delete payload.contact;

        try {
            await axios.post(staffView ? '/api/staff/admission' : '/api/admin/admission', payload, { withCredentials: true });
            setForm(initialForm);
            setMessage({
                severity: 'success',
                text: 'Student account and fee record created. Redirecting to student list…',
            });
            window.setTimeout(() => navigate(staffView ? '/StaffViewStudents' : '/ViewStudent'), 900);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate(staffView ? '/StaffLogin' : '/AdminLogin');
                return;
            }
            setMessage({
                severity: 'error',
                text: error.response?.data?.msg || 'Could not create the student account. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box className="account-form-page">
            <Paper component="form" onSubmit={handleSubmit} elevation={4} className="account-form-card">
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" gap={2}>
                        <Box className="account-form-icon"><PersonAddAlt1 /></Box>
                        <Box>
                            <Typography variant="h4" className="account-form-title">Add Student</Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                {staffView
                                    ? 'Register a student from the staff dashboard.'
                                    : 'Create a student login, admission record, and fee account.'}
                            </Typography>
                        </Box>
                    </Stack>
                    <Button
                        type="button"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(staffView ? '/StaffViewStudents' : '/ViewStudent')}
                        className="account-back-button"
                    >
                        Student list
                    </Button>
                </Stack>

                {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

                <Box className="account-form-section">
                    <Typography variant="h6" className="account-section-title">Account details</Typography>
                    <Box className="account-form-grid">
                        <TextField label="Full name" name="name" value={form.name} onChange={handleChange} required autoComplete="name" InputLabelProps={{ shrink: true }} />
                        <TextField label="Email address" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" InputLabelProps={{ shrink: true }} />
                        <TextField label="Temporary password" name="password" type="password" value={form.password} onChange={handleChange} required inputProps={{ minLength: 6 }} autoComplete="new-password" helperText="At least 6 characters." InputLabelProps={{ shrink: true }} />
                        <TextField label="Department" name="department" value={form.department} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                    </Box>
                </Box>

                <Box className="account-form-section">
                    <Typography variant="h6" className="account-section-title">Student information</Typography>
                    <Box className="account-form-grid">
                        <TextField label="Date of birth" name="dob" type="date" value={form.dob} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        <TextField label="Contact number" name="contact" type="tel" value={form.contact} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        <TextField label="City" name="city" value={form.city} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        <TextField label="Total fee (₹)" name="totalfee" type="number" value={form.totalfee} onChange={handleChange} required inputProps={{ min: 0, step: '0.01' }} InputLabelProps={{ shrink: true }} />
                        <TextField label="Address" name="address" value={form.address} onChange={handleChange} multiline minRows={2} sx={{ gridColumn: { sm: '1 / -1' } }} InputLabelProps={{ shrink: true }} />
                    </Box>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<PersonAddAlt1 />}
                    disabled={submitting}
                    className="account-submit-button"
                >
                    {submitting ? 'Creating account…' : 'Create student account'}
                </Button>
            </Paper>
        </Box>
    );
};

export default AddStudent;
