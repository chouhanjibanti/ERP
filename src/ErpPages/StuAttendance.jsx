import React, { useEffect, useState } from 'react';
import axios from "axios";
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaSave, FaUsers, FaSpinner, FaDownload } from 'react-icons/fa';
import '../CSS/studentattendance.css';

const getLocalDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const excelColumnName = columnNumber => {
    let remaining = columnNumber;
    let columnName = '';
    while (remaining > 0) {
        const remainder = (remaining - 1) % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        remaining = Math.floor((remaining - 1) / 26);
    }
    return columnName;
};

const getAttendanceLabel = status => (
    status === 'Full' ? 'Present' : status === 'Half' ? 'Half Day' : 'Absent/Leave'
);

const getMonthLabel = monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
    });
};

const StuAttendance = () => {
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDate);
    const [selectedMonth, setSelectedMonth] = useState(() => getLocalDate().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [isDownloadingMonthlyReport, setIsDownloadingMonthlyReport] = useState(false);
    const [error, setError] = useState('');
    const [spreadsheetMessage, setSpreadsheetMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchStudentData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get("/api/viewstudent", { withCredentials: true });
            setStudents(response.data.student || []);
        } catch (error) {
            console.error("Error fetching student data:", error);
            setError("Failed to fetch student list. Check server connection (7000) or URL.");
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, []);

    useEffect(() => {
        if (!selectedDate || students.length === 0) {
            setRecords([]);
            return undefined;
        }

        let active = true;
        const fetchAttendanceForDate = async () => {
            setLoadingAttendance(true);
            setError('');
            try {
                const response = await axios.get('/api/stuviewattendance', {
                    params: { date: selectedDate },
                    withCredentials: true,
                });
                if (!active) return;

                const savedRecords = new Map(
                    (response.data.attendance || []).map(record => [String(record.id), record.status])
                );
                setRecords(students.map(student => ({
                    id: student.id,
                    name: student.name,
                    status: savedRecords.get(String(student.id)) || 'Leave',
                    date: selectedDate,
                })));
            } catch (attendanceError) {
                console.error('Error fetching student attendance:', attendanceError);
                if (active) {
                    setRecords([]);
                    setError(attendanceError.response?.data?.msg || 'Failed to load attendance for this date. Please try again.');
                }
            } finally {
                if (active) setLoadingAttendance(false);
            }
        };

        fetchAttendanceForDate();
        return () => { active = false; };
    }, [selectedDate, students]);

    const handleDateChange = (e) => {
        setRecords([]);
        setSelectedDate(e.target.value);
    };

    const handleRadioChange = (e, studentId) => {
        const status = e.target.value;
        setRecords(prevRecords => prevRecords.map(record => 
            record.id === studentId ? { ...record, status: status } : record
        ));
    };

    const downloadMonthlyAttendanceSpreadsheet = async () => {
        if (!selectedMonth) {
            setError('Please select a month for the attendance report.');
            return;
        }

        setIsDownloadingMonthlyReport(true);
        setError('');
        setSpreadsheetMessage('');
        try {
            const response = await axios.get('/api/stuviewattendance', { withCredentials: true });
            const studentIds = new Set(students.map(student => String(student.id)));
            const monthRecords = (response.data.attendance || []).filter(record =>
                String(record.date).startsWith(`${selectedMonth}-`)
                && studentIds.has(String(record.id))
            );
            const attendanceByStudentAndDate = new Map(
                monthRecords.map(record => [`${record.id}:${record.date}`, record.status])
            );
            const [year, month] = selectedMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const firstDateColumn = 3;
            const lastDateColumn = firstDateColumn + daysInMonth - 1;
            const firstDateLetter = excelColumnName(firstDateColumn);
            const lastDateLetter = excelColumnName(lastDateColumn);

            const excelModule = await import('exceljs');
            const ExcelJS = excelModule.default ?? excelModule;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'ERP Student Attendance';
            workbook.created = new Date();
            workbook.calcProperties.fullCalcOnLoad = true;

            const worksheet = workbook.addWorksheet('Monthly Attendance', {
                views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
            });
            const summaryStartColumn = lastDateColumn + 1;
            const summaryColumns = [
                { header: 'Present', key: 'present', width: 12 },
                { header: 'Half Day', key: 'half', width: 12 },
                { header: 'Absent/Leave', key: 'leave', width: 16 },
                { header: 'Recorded Days', key: 'recorded', width: 16 },
                { header: 'Attendance %', key: 'percentage', width: 16 },
            ];
            worksheet.columns = [
                { header: 'Student ID', key: 'id', width: 14 },
                { header: 'Student Name', key: 'name', width: 28 },
                ...Array.from({ length: daysInMonth }, (_, index) => ({
                    header: `${String(index + 1).padStart(2, '0')} ${new Date(year, month - 1, index + 1).toLocaleDateString('en-IN', { weekday: 'short' })}`,
                    key: `day${index + 1}`,
                    width: 14,
                })),
                ...summaryColumns,
            ];
            worksheet.autoFilter = `A1:${excelColumnName(summaryStartColumn + summaryColumns.length - 1)}1`;
            worksheet.getRow(1).height = 28;
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            });

            students.forEach((student, index) => {
                const rowNumber = index + 2;
                const rowValues = {
                    id: student.id,
                    name: student.name || '',
                };
                for (let day = 1; day <= daysInMonth; day += 1) {
                    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                    const status = attendanceByStudentAndDate.get(`${student.id}:${date}`);
                    rowValues[`day${day}`] = status ? getAttendanceLabel(status) : '';
                }

                const summaryColumnNumber = lastDateColumn + 1;
                const presentColumn = excelColumnName(summaryColumnNumber);
                const halfColumn = excelColumnName(summaryColumnNumber + 1);
                const leaveColumn = excelColumnName(summaryColumnNumber + 2);
                const recordedColumn = excelColumnName(summaryColumnNumber + 3);
                const presentCount = Object.values(rowValues).filter(status => status === 'Present').length;
                const halfDayCount = Object.values(rowValues).filter(status => status === 'Half Day').length;
                const absentCount = Object.values(rowValues).filter(status => status === 'Absent/Leave').length;
                const recordedDays = presentCount + halfDayCount + absentCount;
                rowValues.present = {
                    formula: `COUNTIF(${firstDateLetter}${rowNumber}:${lastDateLetter}${rowNumber},"Present")`,
                    result: presentCount,
                };
                rowValues.half = {
                    formula: `COUNTIF(${firstDateLetter}${rowNumber}:${lastDateLetter}${rowNumber},"Half Day")`,
                    result: halfDayCount,
                };
                rowValues.leave = {
                    formula: `COUNTIF(${firstDateLetter}${rowNumber}:${lastDateLetter}${rowNumber},"Absent/Leave")`,
                    result: absentCount,
                };
                rowValues.recorded = {
                    formula: `SUM(${presentColumn}${rowNumber}:${leaveColumn}${rowNumber})`,
                    result: recordedDays,
                };
                rowValues.percentage = {
                    formula: `IF(${recordedColumn}${rowNumber}=0,0,(${presentColumn}${rowNumber}+${halfColumn}${rowNumber}*0.5)/${recordedColumn}${rowNumber})`,
                    result: recordedDays ? (presentCount + halfDayCount * 0.5) / recordedDays : 0,
                };

                const row = worksheet.addRow(rowValues);
                row.getCell(summaryColumnNumber + 4).numFmt = '0.0%';
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: cell.col > 2 ? 'center' : 'left' };
                });
            });

            const instructions = workbook.addWorksheet('Summary & Notes');
            instructions.columns = [{ width: 26 }, { width: 95 }];
            [
                ['Monthly student attendance', getMonthLabel(selectedMonth)],
                ['Present', 'Full-day attendance count.'],
                ['Half Day', 'Half-day attendance count.'],
                ['Absent/Leave', 'Absent or leave count.'],
                ['Recorded Days', 'Only dates with a saved attendance status are included in the calculation. Blank dates are not counted.'],
                ['Attendance %', '(Present + Half Day × 0.5) ÷ Recorded Days. Blank dates are excluded from the percentage.'],
                ['Daily columns', 'Each day shows the saved attendance status. A blank cell means no attendance has been recorded for that date.'],
            ].forEach(([label, description], index) => {
                const row = instructions.addRow([label, description]);
                row.height = index === 0 ? 28 : 32;
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', wrapText: true };
                    if (index === 0) {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };
                    }
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `student-monthly-attendance-${selectedMonth}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            setSpreadsheetMessage(`Monthly attendance report downloaded for ${getMonthLabel(selectedMonth)}.`);
        } catch (spreadsheetError) {
            console.error('Error creating monthly student attendance report:', spreadsheetError);
            setError(spreadsheetError.response?.data?.msg || 'Unable to create the monthly Excel report. Please try again.');
        } finally {
            setIsDownloadingMonthlyReport(false);
        }
    };

    const funsave = async (e) => {
        e.preventDefault();

        if (!selectedDate) {
            setError("Please select the attendance date.");
            return;
        }

        const dataToSend = records.filter(r => r.date === selectedDate);
        if (dataToSend.length === 0) {
             setError("No attendance records to save for the selected date.");
             return;
        }

        setIsSaving(true);
        setError('');

        try {
            const response = await axios.post(
                "/api/attendancecheck",
                { records: dataToSend },
                { withCredentials: true }
            );
            setRecords(dataToSend);
            alert(response.data.msg || "Attendance saved successfully!");
        } catch (error) {
            setError(error.response?.data?.msg || `Error saving attendance: ${error.message}.`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="attendance-container loading-state">
                <FaSpinner className="spinner-icon" />
                <p>Loading Student Data...</p>
            </div>
        );
    }
    
    if (students.length === 0 && !error) {
         return (
            <div className="attendance-container error-state">
                <FaUsers />
                <p>No student members found in the system.</p>
            </div>
        );
    }

    return (
        <div className="attendance-container">
            <h1 className="attendance-title"><FaClock /> Student Daily Attendance</h1>
            
            <form onSubmit={funsave}>
                
                <div className="date-selector-bar">
                    <label htmlFor="attendance-date"><FaCalendarAlt /> Select Date:</label>
                    <input
                        id="attendance-date"
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        required
                        max={getLocalDate()}
                    />
                </div>

                <section className="attendance-spreadsheet-tools" aria-label="Monthly student attendance report">
                    <p>Select a month to download the student attendance report with attendance percentages.</p>
                    <div className="attendance-spreadsheet-actions">
                        <label className="attendance-month-picker">
                            <span>Report month</span>
                            <input
                                type="month"
                                value={selectedMonth}
                                max={getLocalDate().slice(0, 7)}
                                onChange={event => setSelectedMonth(event.target.value)}
                                aria-label="Select month for student attendance report"
                            />
                        </label>
                        <button
                            type="button"
                            className="attendance-spreadsheet-button monthly"
                            onClick={downloadMonthlyAttendanceSpreadsheet}
                            disabled={!selectedMonth || students.length === 0 || isDownloadingMonthlyReport}
                        >
                            {isDownloadingMonthlyReport ? <FaSpinner className="spinner-icon" /> : <FaDownload />}
                            {isDownloadingMonthlyReport ? 'Preparing...' : 'Download Monthly Excel'}
                        </button>
                    </div>
                    {spreadsheetMessage && <p className="attendance-spreadsheet-message" role="status">{spreadsheetMessage}</p>}
                </section>
                
                {error && <div className="message-box error-message">{error}</div>}
                {loadingAttendance && <div className="message-box">Loading attendance for selected date...</div>}
                
                <div className="attendance-table-wrapper">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Present</th>
                                <th>Half Day</th>
                                <th>Absent/Leave</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record, index) => (
                                <tr key={record.id} className={record.status === 'Leave' ? 'status-leave' : ''}>
                                    <td>{index + 1}</td>
                                    <td className="student-name-col">{students.find(m => m.id === record.id)?.name || 'N/A'}</td>
                                    
                                    <td className="radio-col">
                                        <label className={`attendance-option ${record.status === 'Full' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name={`attendance_${record.id}`}
                                                value="Full"
                                                checked={record.status === 'Full'}
                                                onChange={(e) => handleRadioChange(e, record.id)}
                                                disabled={!selectedDate}
                                            />
                                            <FaCheckCircle className="check-icon full-day" />
                                            <span>Present</span>
                                        </label>
                                    </td>
                                    
                                    <td className="radio-col">
                                        <label className={`attendance-option ${record.status === 'Half' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name={`attendance_${record.id}`}
                                                value="Half"
                                                checked={record.status === 'Half'}
                                                onChange={(e) => handleRadioChange(e, record.id)}
                                                disabled={!selectedDate}
                                            />
                                            <FaCheckCircle className="check-icon half-day" />
                                            <span>Half Day</span>
                                        </label>
                                    </td>
                                    
                                    <td className="radio-col">
                                        <label className={`attendance-option ${record.status === 'Leave' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name={`attendance_${record.id}`}
                                                value="Leave"
                                                checked={record.status === 'Leave'}
                                                onChange={(e) => handleRadioChange(e, record.id)}
                                                disabled={!selectedDate}
                                            />
                                            <FaTimesCircle className="check-icon leave-status" />
                                            <span>Absent/Leave</span>
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button 
                    type='submit' 
                    className='save-button' 
                    disabled={isSaving || loadingAttendance || !selectedDate || students.length === 0 || records.length === 0}
                >
                    <FaSave /> {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
            </form>
        </div>
    );
};

export default StuAttendance;