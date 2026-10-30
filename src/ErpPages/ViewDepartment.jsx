import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faPlus, faBuilding, faInfoCircle, faSpinner, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import '../CSS/viewdept.css';

const BASE_URL = "/api";

const ViewDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const navigate = useNavigate();

  const fetchDepartmentData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${BASE_URL}/viewdepartment`);
      if (Array.isArray(response.data.dept)) {
        setDepartments(response.data.dept);
      } else {
        setDepartments([]);
        setError("The department list returned an unexpected response.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Unable to load departments. Check the server connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentData();
  }, [fetchDepartmentData]);

  const deleteDepartment = async (mongoId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }
    setDeletingId(mongoId);
    setError("");
    try {
      await axios.delete(`${BASE_URL}/deletedepartment/${mongoId}`);
      setDepartments(current => current.filter(department => department._id !== mongoId));
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Unable to delete the department. Please try again.");
    } finally {
      setDeletingId("");
    }
  };

  const handleUpdateClick = (mongoId) => {
    navigate(`/UpdateDepartment/${mongoId}`);
  };

  return (
    <main className="admin-page__containerz">
      <div className="admin-page__headerz">
        <div>
          <p className="admin-page__eyebrowz">ADMINISTRATION</p>
          <h1 className="admin-page__titlez">
            <FontAwesomeIcon icon={faBuilding} className="admin-page__iconz" />
            Department Directory
          </h1>
          <p className="admin-page__introz">Manage department information and descriptions.</p>
        </div>
        <button 
          className="admin-page__button--primaryz" 
          onClick={() => navigate('/DeptRegistration')}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Department
        </button>
      </div>

      {error && (
        <div className="admin-page__messagez errorz" role="alert">
          <span>{error}</span>
          {loading === false && departments.length === 0 && (
            <button type="button" className="department-retry-button" onClick={fetchDepartmentData}>
              <FontAwesomeIcon icon={faRotateRight} /> Try again
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="admin-page__messagez loadingz" role="status">
          <FontAwesomeIcon icon={faSpinner} className="icon-spin" /> Loading department data...
        </div>
      ) : (
        <>
          {departments.length === 0 ? (
            <div className="admin-page__message--emptyz">
                <span className="department-empty-icon"><FontAwesomeIcon icon={faInfoCircle} /></span>
                <strong>No departments yet</strong>
                <span>Add the first department to start organizing your institution.</span>
                <button className="admin-page__button--primaryz" onClick={() => navigate('/DeptRegistration')}>
                  <FontAwesomeIcon icon={faPlus} /> Add department
                </button>
            </div>
          ) : (
            <>
              <div className="admin-page__summaryz">
                <span className="department-summary-icon"><FontAwesomeIcon icon={faBuilding} /></span>
                <div>
                  <strong>{departments.length}</strong>
                  <span>{departments.length === 1 ? "Department registered" : "Departments registered"}</span>
                </div>
              </div>
              <div className="department-grid__containerz">
                {departments.map((department) => (
                  <div key={department._id} className="department-card__itemz">
                    <div className="department-card__contentz">
                        <div className="department-card__topz">
                          <span className="department-card__markz"><FontAwesomeIcon icon={faBuilding} /></span>
                          <span className="department-card__idz">ID {department.departId || "N/A"}</span>
                        </div>
                        <h2 className="department-card__namez">{department.departName || "Unnamed department"}</h2>
                        <p className="department-card__descriptionz">{department.departDescription || "No description provided yet."}</p>
                    </div>

                    <div className="department-card__actionsz">
                        <button 
                            className="department-card__button--updatez" 
                            onClick={() => handleUpdateClick(department._id)}
                            title="Edit Department"
                            aria-label={`Update ${department.departName || "department"}`}
                        >
                            <FontAwesomeIcon icon={faEdit} /> Edit details
                        </button>
                        <button 
                            className="department-card__button--deletez" 
                            onClick={() => deleteDepartment(department._id)}
                            title="Delete Department"
                            disabled={deletingId === department._id}
                            aria-label={`Delete ${department.departName || "department"}`}
                        >
                            <FontAwesomeIcon
                                icon={deletingId === department._id ? faSpinner : faTrash}
                                className={deletingId === department._id ? "icon-spin" : undefined}
                            />
                            {deletingId === department._id ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
};

export default ViewDepartment;