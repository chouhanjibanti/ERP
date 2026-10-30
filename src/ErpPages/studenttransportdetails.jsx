import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Container, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, Grid, 
    CircularProgress, Alert, Paper 
} from '@mui/material';
import { DirectionsBus, AccessTime, Save } from '@mui/icons-material';
import '../CSS/transportEnrollment.css';

const primaryColor = '#1e2a38';
const secondaryColor = '#007bff';
const pageBg = '#ffffff';
const cardShadow = '0 6px 18px rgba(0, 0, 0, 0.1)';

const TransportRegister = () => {
  const [formData, setFormData] = useState({
    route: '',            
    stop: '',             
    arrivalTime: '',
    departureTime: '',
  });
  const [routes, setRoutes] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [error, setError] = useState('');
  const [loadingRoutes, setLoadingRoutes] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [submissionMessage, setSubmissionMessage] = useState(null);

  useEffect(() => {
    setLoadingRoutes(true);
    axios
      .get('/api/viewroutes')
      .then((res) => {
        setRoutes(res.data.routes || []);
        setLoadingRoutes(false); 
      })
      .catch(() => {
        setError('Failed to fetch routes');
        setLoadingRoutes(false); 
      });
  }, []);

  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    const selectedRoute = routes.find((route) => route._id === routeId);
    setFormData({
      route: selectedRoute?.routeNumber || '',
      stop: '',
      arrivalTime: '',
      departureTime: '',
    });
    setFilteredStops(selectedRoute?.stops || []);
    setSubmissionMessage(null);
  };

  const handleStopChange = (e) => {
    const stopId = e.target.value;
    const selectedStop = filteredStops.find((stop) => stop._id === stopId);
    setFormData({
      ...formData,
      stop: selectedStop?.stopName || '',
      arrivalTime: selectedStop?.arrivalTime || '',
      departureTime: selectedStop?.departureTime || '',
    });
    setSubmissionMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      await axios.post(
        '/api/studenttransportdetails',
        formData,
        {
          withCredentials: true,
        }
      );
      setSubmissionMessage({ type: 'success', text: 'Transport details added successfully!' });
    } catch (err) {
      const errorMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        err.message ||
        'Unable to submit transport enrollment. Please try again.';
      setSubmissionMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoute = routes.find(r => r.routeNumber === formData.route);
  const currentStop = filteredStops.find(s => s.stopName === formData.stop);

  return (
    <Box className="transport-enrollment-page" sx={{ backgroundColor: pageBg, minHeight: '100vh', py: 6 }}>
      <Container component="main" maxWidth="sm">
        <Paper 
          elevation={10} 
          className="transport-enrollment-card"
          sx={{ 
            borderRadius: '16px', 
            p: { xs: 2.5, sm: 4, md: 5 }, 
            boxShadow: cardShadow, 
          }}
        >
          <Box
            className="transport-enrollment-header"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <DirectionsBus 
              sx={{ fontSize: 48, color: secondaryColor, mb: 1 }} 
            />
            <Typography 
              component="h1" 
              variant="h4"
              sx={{ fontWeight: 700, color: primaryColor, textAlign: 'center' }}
            >
              Transport Enrollment
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.75, textAlign: 'center' }}>
              Select your preferred route and stop details.
            </Typography>
          </Box>

          {loadingRoutes && (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} sx={{ color: secondaryColor }} />
              <Typography sx={{ ml: 1, color: primaryColor }}>Fetching transport routes...</Typography>
            </Box>
          )}
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {submissionMessage && (
            <Alert 
              severity={submissionMessage.type} 
              sx={{ mb: 2 }}
            >
              {submissionMessage.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="transport-enrollment-form" sx={{ mt: 1 }}>
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required disabled={loadingRoutes}>
                  <InputLabel id="route-select-label">Select Route</InputLabel>
                  <Select
                    labelId="route-select-label"
                    value={currentRoute?._id || ''} 
                    label="Select Route"
                    onChange={handleRouteChange}
                    sx={{ 
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: secondaryColor, borderWidth: '2px' },
                    }}
                  >
                    <MenuItem value="">
                      <em>--- Choose Route ---</em>
                    </MenuItem>
                    {routes.map((route) => (
                      <MenuItem key={route._id} value={route._id}>
                        Route: {route.routeNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl 
                  fullWidth 
                  required 
                  disabled={!formData.route || filteredStops.length === 0}
                >
                  <InputLabel id="stop-select-label">Select Stop</InputLabel>
                  <Select
                    labelId="stop-select-label"
                    value={currentStop?._id || ''}
                    label="Select Stop"
                    onChange={handleStopChange}
                    sx={{ 
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: secondaryColor, borderWidth: '2px' },
                    }}
                  >
                    <MenuItem value="">
                      <em>--- Choose Stop ---</em>
                    </MenuItem>
                    {filteredStops.map((stop) => (
                      <MenuItem key={stop._id} value={stop._id}>
                        {stop.stopName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Expected Arrival Time"
                  value={formData.arrivalTime || 'N/A'}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <AccessTime sx={{ color: primaryColor, mr: 1 }} />,
                  }}
                  variant="outlined"
                  disabled={!formData.arrivalTime}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': { backgroundColor: '#f8fafc' },
                    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#64748b' },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Expected Departure Time"
                  value={formData.departureTime || 'N/A'}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <AccessTime sx={{ color: primaryColor, mr: 1 }} />,
                  }}
                  variant="outlined"
                  disabled={!formData.departureTime}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': { backgroundColor: '#f8fafc' },
                    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#64748b' },
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!formData.route || !formData.stop || isSubmitting}
              sx={{
                mt: 4,
                backgroundColor: secondaryColor,
                '&:hover': { backgroundColor: '#0056b3', transform: 'translateY(-1px)', boxShadow: '0 7px 16px rgba(0, 123, 255, 0.28)' },
                '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#64748b' },
                py: 1.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                transition: '0.3s',
                boxShadow: '0 4px 10px rgba(0, 123, 255, 0.4)',
              }}
            >
              {isSubmitting ? (
                <CircularProgress color="inherit" size={24} />
              ) : (
                <>
                  <Save sx={{ mr: 1 }} />
                  Finalize Transport Registration
                </>
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TransportRegister;
