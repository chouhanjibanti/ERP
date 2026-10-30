import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FaUserCircle, FaIdCard, FaEnvelope, FaPhoneAlt, FaMapMarkedAlt,
    FaCity, FaSpinner, FaExclamationCircle, FaCamera, FaEdit, FaSave, FaTimes,
} from "react-icons/fa";
import "../CSS/studentprofile.css";

const emptyForm = { name: "", contact: "", city: "", address: "" };

const StudentProfile = () => {
    const [student, setStudent] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [imageVersion, setImageVersion] = useState(0);

    useEffect(() => {
        if (!selectedImage) {
            setPreviewUrl("");
            return undefined;
        }
        const objectUrl = URL.createObjectURL(selectedImage);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedImage]);

    const fetchStudentProfile = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/admstudentprofile", { withCredentials: true });
            const profile = response.data.student;
            setStudent(profile);
            setFormData({
                name: profile.name || "",
                contact: profile.contact ? String(profile.contact) : "",
                city: profile.city || "",
                address: profile.address || "",
            });
            setError("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.msg ||
                requestError.response?.data?.message ||
                "Failed to fetch student profile. Please log in again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentProfile();
    }, []);

    const handleProfileUpdate = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            const response = await axios.put("/api/studentprofile", formData, { withCredentials: true });
            setStudent(current => ({ ...current, ...response.data.student }));
            setEditing(false);
            setMessage(response.data.msg || "Profile updated successfully.");
            setMessageType("success");
        } catch (requestError) {
            setMessage(
                requestError.response?.data?.msg ||
                requestError.response?.data?.message ||
                "Unable to update your profile. Please try again."
            );
            setMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const handleImageSelection = (event) => {
        const image = event.target.files?.[0];
        event.target.value = "";
        setMessage("");
        if (!image) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
            setMessage("Choose a JPG, PNG, or WEBP image.");
            setMessageType("error");
            return;
        }
        if (image.size > 5 * 1024 * 1024) {
            setMessage("Profile image must be 5 MB or smaller.");
            setMessageType("error");
            return;
        }
        setSelectedImage(image);
    };

    const handleImageUpload = async (event) => {
        event.preventDefault();
        if (!selectedImage) return;

        const data = new FormData();
        data.append("image", selectedImage);
        setUploading(true);
        setMessage("");
        try {
            const response = await axios.put("/api/studentprofile/image", data, { withCredentials: true });
            setStudent(current => ({ ...current, hasProfileImage: true }));
            setSelectedImage(null);
            setImageVersion(Date.now());
            setMessage(response.data.msg || "Profile photo updated successfully.");
            setMessageType("success");
        } catch (requestError) {
            setMessage(
                requestError.response?.data?.msg ||
                requestError.response?.data?.message ||
                "Unable to upload your profile photo. Please try again."
            );
            setMessageType("error");
        } finally {
            setUploading(false);
        }
    };

    const cancelEditing = () => {
        setFormData({
            name: student.name || "",
            contact: student.contact ? String(student.contact) : "",
            city: student.city || "",
            address: student.address || "",
        });
        setEditing(false);
        setMessage("");
    };

    if (loading) {
        return (
            <div className="profile-container-two">
                <div className="status-message loading-state"><FaSpinner className="spinner" /> Loading profile data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-container-two">
                <div className="status-message error-state"><FaExclamationCircle /> {error}</div>
            </div>
        );
    }

    return (
        <div className="profile-container-two">
            {student ? (
                <div className="simple-card-two">
                    <div className="simple-header-two">
                        {previewUrl || student.hasProfileImage ? (
                            <img
                                src={previewUrl || `/api/studentprofile/image?v=${imageVersion}`}
                                alt={`${student.name || "Student"} profile`}
                                className="student-profile-photo"
                            />
                        ) : (
                            <FaUserCircle className="profile-photo-placeholder" />
                        )}
                        <h2 className="profile-name-two">{student.name || "N/A"}</h2>
                        <p className="profile-role">Student</p>
                        <form className="student-photo-form" onSubmit={handleImageUpload}>
                            <label className="student-photo-select" htmlFor="student-profile-image">
                                <FaCamera /> {selectedImage ? "Choose another photo" : "Change profile photo"}
                            </label>
                            <input
                                id="student-profile-image"
                                className="student-photo-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageSelection}
                            />
                            {selectedImage && (
                                <div className="student-photo-actions">
                                    <button type="submit" className="profile-action-button photo-save" disabled={uploading}>
                                        {uploading ? <><FaSpinner className="spinner" /> Uploading...</> : <><FaSave /> Save photo</>}
                                    </button>
                                    <button
                                        type="button"
                                        className="profile-action-button photo-cancel"
                                        onClick={() => setSelectedImage(null)}
                                        disabled={uploading}
                                        aria-label="Cancel selected profile photo"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                            <span className="student-photo-hint">JPG, PNG, or WEBP · Max 5 MB</span>
                        </form>
                    </div>

                    <div className="simple-details-two">
                        <div className="profile-section-title">
                            <h3 className="details-heading">Personal Information</h3>
                            {!editing && (
                                <button
                                    type="button"
                                    className="profile-action-button profile-edit-button"
                                    onClick={() => { setEditing(true); setMessage(""); }}
                                >
                                    <FaEdit /> Edit profile
                                </button>
                            )}
                        </div>
                        {editing ? (
                            <form className="student-profile-edit-form" onSubmit={handleProfileUpdate}>
                                <label>
                                    Full name
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={formData.name}
                                        onChange={event => setFormData({ ...formData, name: event.target.value })}
                                        required
                                    />
                                </label>
                                <label>
                                    Contact number
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{7,15}"
                                        value={formData.contact}
                                        onChange={event => setFormData({ ...formData, contact: event.target.value })}
                                        placeholder="7 to 15 digits"
                                    />
                                </label>
                                <label>
                                    City
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={formData.city}
                                        onChange={event => setFormData({ ...formData, city: event.target.value })}
                                    />
                                </label>
                                <label>
                                    Address
                                    <textarea
                                        maxLength={500}
                                        rows={3}
                                        value={formData.address}
                                        onChange={event => setFormData({ ...formData, address: event.target.value })}
                                    />
                                </label>
                                <p className="student-profile-edit-note">Email and student ID are managed by the school and cannot be changed here.</p>
                                <div className="student-profile-form-actions">
                                    <button type="submit" className="profile-action-button profile-save-button" disabled={saving}>
                                        {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save changes</>}
                                    </button>
                                    <button type="button" className="profile-action-button profile-cancel-button" onClick={cancelEditing} disabled={saving}>
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="detail-row-two">
                                    <FaIdCard className="detail-icon-two" />
                                    <strong>Student ID:</strong> <span>{student.id || "N/A"}</span>
                                </div>
                                <div className="detail-row-two">
                                    <FaEnvelope className="detail-icon-two" />
                                    <strong>Email:</strong> <span className="link-style">{student.email || "N/A"}</span>
                                </div>
                                <div className="detail-row-two">
                                    <FaPhoneAlt className="detail-icon-two" />
                                    <strong>Contact:</strong> <span>{student.contact || "N/A"}</span>
                                </div>

                                <hr className="detail-separator" />
                                <h3 className="details-heading">Address Details</h3>
                                <div className="detail-row-two">
                                    <FaCity className="detail-icon-two" />
                                    <strong>City:</strong> <span>{student.city || "N/A"}</span>
                                </div>
                                <div className="detail-row-two full-address-two">
                                    <FaMapMarkedAlt className="detail-icon-two" />
                                    <strong>Address:</strong> <span>{student.address || "N/A"}</span>
                                </div>
                            </>
                        )}
                        {message && <p className={`student-profile-message ${messageType}`} role={messageType === "error" ? "alert" : "status"}>{message}</p>}
                    </div>
                </div>
            ) : (
                <div className="simple-card-two profile-not-found-two">No Student Profile Found</div>
            )}
        </div>
    );
};

export default StudentProfile;
