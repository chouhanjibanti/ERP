import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faChevronLeft, faSave, faSpinner, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import "../CSS/updateDepartment.css";

const UpdateDepartment = () => {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDepartmentData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`/api/Dviewbyid/${deptId}`);
      const data = response.data.department;
      if (!data) {
        setError("Department data was not returned by the server.");
        return;
      }
      setDepartment(data);
      setDescription(data.departDescription || "");
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Failed to fetch department data.");
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    fetchDepartmentData();
  }, [fetchDepartmentData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await axios.put(`/api/updatedepartment/${deptId}`, {
        departDescription: description.trim(),
      });
      setDepartment(response.data.department || { ...department, departDescription: description.trim() });
      setSuccess(response.data.msg || "Department updated successfully.");
      window.setTimeout(() => navigate("/ViewDepartment"), 900);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Failed to update department.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="department-edit-page">
      <section className="department-edit-card">
        <header className="department-edit-header">
          <div className="department-edit-heading">
            <span className="department-edit-icon"><FontAwesomeIcon icon={faBuilding} /></span>
            <div>
              <p className="department-edit-eyebrow">ADMINISTRATION / DEPARTMENTS</p>
              <h1>Update Department</h1>
              <p className="department-edit-subtitle">Review department details and update its description.</p>
            </div>
          </div>
          <button type="button" className="department-back-button" onClick={() => navigate("/ViewDepartment")}>
            <FontAwesomeIcon icon={faChevronLeft} /> Back to departments
          </button>
        </header>

        {error && (
          <div className="department-form-message error" role="alert">
            <FontAwesomeIcon icon={faCircleExclamation} /> {error}
            {!department && <button type="button" onClick={fetchDepartmentData}>Try again</button>}
          </div>
        )}
        {success && <div className="department-form-message success" role="status">{success}</div>}

        {loading ? (
          <div className="department-edit-loading"><FontAwesomeIcon icon={faSpinner} className="icon-spin" /> Loading department details...</div>
        ) : department ? (
          <form className="department-edit-form" onSubmit={handleSubmit}>
            <div className="department-readonly-grid">
              <div className="department-readonly-field">
                <span>Department name</span>
                <strong>{department.departName || "Unnamed department"}</strong>
              </div>
              <div className="department-readonly-field">
                <span>Department ID</span>
                <strong>{department.departId || "N/A"}</strong>
              </div>
            </div>

            <label className="department-description-field" htmlFor="department-description">
              <span>Department description <b aria-hidden="true">*</b></span>
              <textarea
                id="department-description"
                name="departDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the department, its programs, and areas of focus..."
                rows={6}
                maxLength={1000}
                required
              />
              <small>{description.length}/1000 characters</small>
            </label>

            <footer className="department-edit-actions">
              <button type="button" className="department-cancel-button" onClick={() => navigate("/ViewDepartment")} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="department-save-button" disabled={saving || !description.trim()}>
                <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? "icon-spin" : undefined} />
                {saving ? "Saving changes..." : "Save changes"}
              </button>
            </footer>
          </form>
        ) : null}
      </section>
    </main>
  );
};

export default UpdateDepartment;
