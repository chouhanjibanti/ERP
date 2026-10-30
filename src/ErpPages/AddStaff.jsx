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
    contact: '',
    city: '',
    address: '',
    department: '',
};

const AddStaff = () => {
    const [form, setForm] = useState(initialForm);
    const [image, setImage] = useState(null);
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

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        if (image) formData.append('image', image);

        try {
            await axios.post('/api/staffregister', formData, { withCredentials: true });
            setForm(initialForm);
            setImage(null);
            setMessage({ severity: 'success', text: 'Staff account created successfully. Redirecting to staff list…' });
            window.setTimeout(() => navigate('/ViewStaff'), 900);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/AdminLogin');
                return;
            }
            setMessage({
                severity: 'error',
                text: error.response?.data?.msg || 'Could not create the staff account. Please try again.',
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
                            <Typography variant="h4" className="account-form-title">Add Staff Member</Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Create a staff login and profile.</Typography>
                        </Box>
                    </Stack>
                    <Button type="button" startIcon={<ArrowBack />} onClick={() => navigate('/ViewStaff')} className="account-back-button">Staff list</Button>
                </Stack>

                {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

                <Box className="account-form-section">
                    <Typography variant="h6" className="account-section-title">Account details</Typography>
                    <Box className="account-form-grid">
                        <TextField label="Full name" name="name" value={form.name} onChange={handleChange} required autoComplete="name" InputLabelProps={{ shrink: true }} />
                        <TextField label="Email address" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" InputLabelProps={{ shrink: true }} />
                        <TextField label="Temporary password" name="password" type="password" value={form.password} onChange={handleChange} required inputProps={{ minLength: 6 }} autoComplete="new-password" helperText="At least 6 characters." InputLabelProps={{ shrink: true }} />
                        <TextField label="Department" name="department" value={form.department} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Box>
                </Box>

                <Box className="account-form-section">
                    <Typography variant="h6" className="account-section-title">Contact information</Typography>
                    <Box className="account-form-grid">
                        <TextField label="Contact number" name="contact" type="tel" value={form.contact} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        <TextField label="City" name="city" value={form.city} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        <TextField label="Address" name="address" value={form.address} onChange={handleChange} multiline minRows={2} sx={{ gridColumn: { sm: '1 / -1' } }} InputLabelProps={{ shrink: true }} />
                        <Box className="account-image-field">
                            <Typography component="label" htmlFor="staff-profile-image" variant="body2">
                                Profile image <span>(optional · JPG, PNG, or WEBP · up to 5 MB)</span>
                            </Typography>
                            <input
                                id="staff-profile-image"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={event => {
                                    setImage(event.target.files?.[0] || null);
                                    setMessage(null);
                                }}
                            />
                            {image && <Typography variant="caption" color="text.secondary">{image.name}</Typography>}
                        </Box>
                    </Box>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<PersonAddAlt1 />}
                    disabled={submitting}
                    className="account-submit-button"
                >
                    {submitting ? 'Creating account…' : 'Create staff account'}
                </Button>
            </Paper>
        </Box>
    );
};

export default AddStaff;
