import React, { useEffect, useMemo, useState } from 'react';
import axios from "axios";
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaSave, FaUsers,
    FaSpinner, FaDownload, FaSyncAlt
} from 'react-icons/fa';
import '../CSS/staffattendance.css';

const HISTORY_PAGE_SIZES = [10, 25, 50];
const ATTENDANCE_STATUSES = ['Full', 'Half', 'Leave'];
const getLocalDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const getMonthKey = date => date.slice(0, 7);

const getMonthLabel = monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
    });
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

const escapeCsv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const getAttendanceLabel = status => (
    status === 'Full' ? 'Present' : status === 'Half' ? 'Half Day' : 'Absent/Leave'
);

const StaffAttendance = () => {
    const { staffId } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [records, setRecords] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDate);
    const [selectedMonth, setSelectedMonth] = useState(() => getLocalDate().slice(0, 7));
    const [historyDateFilter, setHistoryDateFilter] = useState('all');
    const [historyFromDate, setHistoryFromDate] = useState('');
    const [historyToDate, setHistoryToDate] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('');
    const [historySort, setHistorySort] = useState('newest');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);
    const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isDownloadingMonthlyReport, setIsDownloadingMonthlyReport] = useState(false);
    const [error, setError] = useState('');
    const [historyError, setHistoryError] = useState('');
    const [spreadsheetMessage, setSpreadsheetMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const attendanceStaff = useMemo(
        () => staffId ? staff.filter(member => String(member.id) === String(staffId)) : staff,
        [staff, staffId]
    );
    const historyMonths = useMemo(
        () => [...new Set(attendanceHistory.map(record => getMonthKey(record.date)))].sort().reverse(),
        [attendanceHistory]
    );
    const periodAttendance = useMemo(() => {
        const today = new Date();
        const todayString = getLocalDate();
        let startDate = '';
        let endDate = '';

        if (historyDateFilter === 'this-month') {
            startDate = `${todayString.slice(0, 7)}-01`;
            endDate = todayString;
        } else if (historyDateFilter === 'last-month') {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
            endDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${String(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
        } else if (historyDateFilter === 'this-year') {
            startDate = `${today.getFullYear()}-01-01`;
            endDate = getLocalDate();
        } else if (historyDateFilter === 'custom') {
            startDate = historyFromDate;
            endDate = historyToDate;
        } else if (/^\d{4}-\d{2}$/.test(historyDateFilter)) {
            startDate = `${historyDateFilter}-01`;
            const [year, month] = historyDateFilter.split('-').map(Number);
            endDate = `${historyDateFilter}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
        }

        if (startDate && endDate && startDate > endDate) return [];
        return attendanceHistory.filter(record =>
            (!startDate || record.date >= startDate) && (!endDate || record.date <= endDate)
        );
    }, [attendanceHistory, historyDateFilter, historyFromDate, historyToDate]);
    const invalidHistoryDateRange = historyDateFilter === 'custom'
        && historyFromDate
        && historyToDate
        && historyFromDate > historyToDate;
    const filteredHistory = useMemo(() => periodAttendance
        .filter(record => !historyStatusFilter || record.status === historyStatusFilter)
        .sort((first, second) => String(first.date).localeCompare(String(second.date)) * (historySort === 'newest' ? -1 : 1)),
    [periodAttendance, historyStatusFilter, historySort]);
    const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
    const currentHistoryPage = Math.min(historyPage, historyPageCount);
    const paginatedHistory = filteredHistory.slice(
        (currentHistoryPage - 1) * historyPageSize,
        currentHistoryPage * historyPageSize
    );
    const historyPageNumbers = [...new Set([
        1,
        historyPageCount,
        ...[currentHistoryPage - 1, currentHistoryPage, currentHistoryPage + 1]
            .filter(pageNumber => pageNumber > 1 && pageNumber < historyPageCount),
    ])].sort((first, second) => first - second);

    const fetchStaffData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get("/api/viewstaff", { withCredentials: true });
            setStaff(response.data.staff || []);
        } catch (error) {
            console.error("Error fetching staff data:", error);
            setError("Failed to fetch staff list. Please try again.");
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffData();
    }, []);

    useEffect(() => {
        if (staffId || !selectedDate || attendanceStaff.length === 0) {
            setRecords([]);
            return undefined;
        }

        let active = true;
        const fetchAttendanceForDate = async () => {
            setLoadingAttendance(true);
            setError('');
            try {
                const response = await axios.get('/api/viewattendance', {
                    params: { date: selectedDate },
                    withCredentials: true,
                });
                if (!active) return;

                const savedRecords = new Map(
                    (response.data.attendance || []).map(record => [String(record.id), record.status])
                );
                setRecords(attendanceStaff.map(member => ({
                    id: member.id,
                    name: member.name,
                    status: savedRecords.get(String(member.id)) || 'Leave',
                    date: selectedDate,
                })));
            } catch (attendanceError) {
                console.error('Error fetching staff attendance:', attendanceError);
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
    }, [attendanceStaff, selectedDate, staffId]);

    useEffect(() => {
        if (!staffId || loading || attendanceStaff.length === 0) {
            setAttendanceHistory([]);
            return undefined;
        }

        let active = true;
        const fetchAttendanceHistory = async () => {
            setLoadingHistory(true);
            setHistoryError('');
            try {
                const response = await axios.get('/api/viewattendance', {
                    withCredentials: true,
                });
                if (!active) return;

                const staffRecords = (response.data.attendance || [])
                    .filter(record => String(record.id) === String(staffId))
                    .sort((first, second) => String(second.date).localeCompare(String(first.date)));
                setAttendanceHistory(staffRecords);
            } catch (historyFetchError) {
                console.error('Error fetching staff attendance history:', historyFetchError);
                if (active) {
                    setAttendanceHistory([]);
                    setHistoryError(historyFetchError.response?.data?.msg || 'Failed to load staff attendance history. Please try again.');
                }
            } finally {
                if (active) setLoadingHistory(false);
            }
        };

        fetchAttendanceHistory();
        return () => { active = false; };
    }, [attendanceStaff, historyRefreshToken, loading, staffId]);

    const handleDateChange = (e) => {
        setRecords([]);
        setSelectedDate(e.target.value);
    };

    const clearHistoryFilters = () => {
        setHistoryDateFilter('all');
        setHistoryFromDate('');
        setHistoryToDate('');
        setHistoryStatusFilter('');
        setHistorySort('newest');
        setHistoryPage(1);
    };

    const exportAttendanceHistory = () => {
        const rows = [
            ['Staff ID', 'Staff Name', 'Date', 'Status'],
            ...filteredHistory.map(record => [
                attendanceStaff[0].id,
                attendanceStaff[0].name,
                record.date,
                record.status === 'Full' ? 'Present' : record.status === 'Half' ? 'Half Day' : 'Absent/Leave',
            ]),
        ];
        const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `staff-${attendanceStaff[0].id}-attendance.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleRadioChange = (e, staffId) => {
        const status = e.target.value;
        setRecords(prevRecords => prevRecords.map(record => 
            record.id === staffId ? { ...record, status: status } : record
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
            const response = await axios.get('/api/viewattendance', { withCredentials: true });
            const staffIds = new Set(attendanceStaff.map(member => String(member.id)));
            const monthRecords = (response.data.attendance || []).filter(record =>
                String(record.date).startsWith(`${selectedMonth}-`)
                && staffIds.has(String(record.id))
            );
            const attendanceByStaffAndDate = new Map(
                monthRecords.map(record => [`${record.id}:${record.date}`, record.status])
            );
            const [year, month] = selectedMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const workingDaysInMonth = Array.from({ length: daysInMonth }, (_, index) =>
                new Date(year, month - 1, index + 1).getDay()
            ).filter(dayOfWeek => dayOfWeek !== 0).length;
            const firstDateColumn = 3;
            const lastDateColumn = firstDateColumn + daysInMonth - 1;
            const firstDateLetter = excelColumnName(firstDateColumn);
            const lastDateLetter = excelColumnName(lastDateColumn);

            const excelModule = await import('exceljs');
            const ExcelJS = excelModule.default ?? excelModule;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'ERP Attendance';
            workbook.created = new Date();

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
                { header: 'Monthly Salary (₹) - Enter', key: 'monthlySalary', width: 23 },
                { header: 'Working Days (Mon-Sat)', key: 'workingDays', width: 23 },
                { header: 'Daily Rate (₹)', key: 'dailyRate', width: 17 },
                { header: 'Payable Salary (₹)', key: 'payableSalary', width: 20 },
            ];
            worksheet.columns = [
                { header: 'Staff ID', key: 'id', width: 14 },
                { header: 'Staff Name', key: 'name', width: 28 },
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

            attendanceStaff.forEach((member, index) => {
                const rowNumber = index + 2;
                const rowValues = {
                    id: member.id,
                    name: member.name || '',
                };
                for (let day = 1; day <= daysInMonth; day += 1) {
                    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                    const status = attendanceByStaffAndDate.get(`${member.id}:${date}`);
                    rowValues[`day${day}`] = status ? getAttendanceLabel(status) : '';
                }

                const summaryColumnNumber = lastDateColumn + 1;
                const presentColumn = excelColumnName(summaryColumnNumber);
                const halfColumn = excelColumnName(summaryColumnNumber + 1);
                const leaveColumn = excelColumnName(summaryColumnNumber + 2);
                const recordedColumn = excelColumnName(summaryColumnNumber + 3);
                const salaryColumn = excelColumnName(summaryColumnNumber + 5);
                const workingDaysColumn = excelColumnName(summaryColumnNumber + 6);
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
                rowValues.monthlySalary = null;
                rowValues.workingDays = workingDaysInMonth;
                rowValues.dailyRate = {
                    formula: `IF(${salaryColumn}${rowNumber}="","",${salaryColumn}${rowNumber}/${workingDaysColumn}${rowNumber})`,
                    result: '',
                };
                rowValues.payableSalary = {
                    formula: `IF(${salaryColumn}${rowNumber}="","",${salaryColumn}${rowNumber}*(${presentColumn}${rowNumber}+${halfColumn}${rowNumber}*0.5)/${workingDaysColumn}${rowNumber})`,
                    result: '',
                };
                const row = worksheet.addRow(rowValues);
                row.getCell(summaryColumnNumber + 4).numFmt = '0.0%';
                row.getCell(summaryColumnNumber + 5).numFmt = '₹#,##0.00';
                row.getCell(summaryColumnNumber + 5).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFF2CC' },
                };
                row.getCell(summaryColumnNumber + 5).dataValidation = {
                    type: 'decimal',
                    operator: 'greaterThanOrEqual',
                    formulae: [0],
                    allowBlank: true,
                    showErrorMessage: true,
                    errorTitle: 'Invalid salary',
                    error: 'Enter a monthly salary of zero or greater.',
                };
                row.getCell(summaryColumnNumber + 7).numFmt = '₹#,##0.00';
                row.getCell(summaryColumnNumber + 8).numFmt = '₹#,##0.00';
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: cell.col > 2 ? 'center' : 'left' };
                });
            });

            const instructions = workbook.addWorksheet('Summary & Notes');
            instructions.columns = [{ width: 26 }, { width: 95 }];
            [
                ['Monthly staff attendance', getMonthLabel(selectedMonth)],
                ['Present', 'Full-day attendance count.'],
                ['Half Day', 'Half-day attendance count.'],
                ['Absent/Leave', 'Absent or leave count.'],
                ['Recorded Days', 'Only dates with a saved attendance status are included in the calculation. Blank dates are not counted.'],
                ['Attendance %', '(Present + Half Day × 0.5) ÷ Recorded Days. The percentage is based on recorded days, not calendar days.'],
                ['Monthly Salary', 'Enter each staff member’s gross monthly salary in the yellow Monthly Salary (₹) - Enter column.'],
                ['Working Days', `Working days are Monday through Saturday; Sundays are excluded. There are ${workingDaysInMonth} working days in this month. Public holidays are not deducted separately.`],
                ['Daily Rate', 'Monthly Salary ÷ Working Days.'],
                ['Payable Salary', 'Daily Rate × (Present days + Half Days × 0.5). Absent/Leave earns zero salary. Blank attendance dates also earn no salary, so record attendance for each working day.'],
                ['Daily columns', 'Each day shows the saved status. A blank cell means no attendance has been recorded for that date.'],
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
            instructions.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            const buffer = await workbook.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `staff-monthly-attendance-${selectedMonth}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            setSpreadsheetMessage(`Monthly attendance report downloaded for ${getMonthLabel(selectedMonth)}.`);
        } catch (spreadsheetError) {
            console.error('Error creating monthly staff attendance report:', spreadsheetError);
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
                "/api/Sattendancecheck",
                { records: dataToSend },
                { withCredentials: true }
            );
            setRecords(dataToSend);
            alert(response.data.msg || "Attendance saved successfully!");
        } catch (error) {
            console.error("Error saving attendance:", error.response?.data || error);
            setError(error.response?.data?.msg || "Error saving attendance. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="attendance-container loading-state">
                <FaSpinner className="spinner-icon" />
                <p>Loading Staff Data...</p>
            </div>
        );
    }
    
    if (attendanceStaff.length === 0) {
         return (
            <div className="attendance-container error-state">
                <FaUsers />
                <p>{error || (staffId ? 'Staff member not found.' : 'No staff members found.')}</p>
                {error && <button type="button" className="history-back-button" onClick={fetchStaffData}>Try Again</button>}
            </div>
        );
    }

    if (staffId) {
        const presentCount = periodAttendance.filter(record => record.status === 'Full').length;
        const halfDayCount = periodAttendance.filter(record => record.status === 'Half').length;
        const absentCount = periodAttendance.filter(record => record.status === 'Leave').length;
        const attendancePercentage = periodAttendance.length
            ? Math.round(((presentCount + halfDayCount * 0.5) / periodAttendance.length) * 100)
            : 0;
        return (
            <div className="attendance-container staff-attendance-history">
                <button type="button" className="history-back-button" onClick={() => navigate(-1)}>
                    Back
                </button>
                <h1 className="attendance-title"><FaClock /> Attendance History</h1>

                <section className="staff-history-profile" aria-label="Staff member details">
                    <h2>{attendanceStaff[0].name || 'Staff member'}</h2>
                    <p>
                        Staff ID: {attendanceStaff[0].id}
                        {attendanceStaff[0].email ? ` · ${attendanceStaff[0].email}` : ''}
                    </p>
                </section>

                {historyError && (
                    <div className="message-box error-message staff-history-error" role="alert">
                        <span>{historyError}</span>
                        <button type="button" className="history-toolbar-button" onClick={() => setHistoryRefreshToken(token => token + 1)}>
                            <FaSyncAlt /> Try Again
                        </button>
                    </div>
                )}

                {loadingHistory ? (
                    <div className="staff-history-state" role="status">
                        <FaSpinner className="spinner-icon" />
                        <p>Loading attendance history...</p>
                    </div>
                ) : (
                    <>
                        <section className="staff-history-statistics" aria-label="Attendance summary">
                            {[
                                { label: 'Recorded Days', value: periodAttendance.length, type: 'total' },
                                { label: 'Present', value: presentCount, type: 'present' },
                                { label: 'Half Day', value: halfDayCount, type: 'half' },
                                { label: 'Absent/Leave', value: absentCount, type: 'absent' },
                                { label: 'Attendance', value: `${attendancePercentage}%`, type: 'percentage' },
                            ].map(stat => (
                                <div className={`staff-history-stat ${stat.type}`} key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </section>
                        <section className="staff-history-filters" aria-label="Filter attendance history">
                            <label>
                                <span><FaCalendarAlt aria-hidden="true" /> Date range</span>
                                <select
                                    value={historyDateFilter}
                                    onChange={event => {
                                        setHistoryDateFilter(event.target.value);
                                        setHistoryPage(1);
                                    }}
                                >
                                    <option value="all">All dates</option>
                                    <option value="this-month">This month</option>
                                    <option value="last-month">Last month</option>
                                    <option value="this-year">This year</option>
                                    {historyMonths.map(month => (
                                        <option key={month} value={month}>{getMonthLabel(month)}</option>
                                    ))}
                                    <option value="custom">Custom date range</option>
                                </select>
                            </label>
                            {historyDateFilter === 'custom' && (
                                <div className="staff-history-custom-dates">
                                    <label>
                                        <span>From</span>
                                        <input
                                            type="date"
                                            value={historyFromDate}
                                            max={historyToDate || getLocalDate()}
                                            onChange={event => {
                                                setHistoryFromDate(event.target.value);
                                                setHistoryPage(1);
                                            }}
                                        />
                                    </label>
                                    <label>
                                        <span>To</span>
                                        <input
                                            type="date"
                                            value={historyToDate}
                                            min={historyFromDate || undefined}
                                            max={getLocalDate()}
                                            onChange={event => {
                                                setHistoryToDate(event.target.value);
                                                setHistoryPage(1);
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                            <label>
                                <span>Status</span>
                                <select
                                    value={historyStatusFilter}
                                    onChange={event => {
                                        setHistoryStatusFilter(event.target.value);
                                        setHistoryPage(1);
                                    }}
                                >
                                    <option value="">All statuses</option>
                                    {ATTENDANCE_STATUSES.map(status => (
                                        <option key={status} value={status}>
                                            {status === 'Full' ? 'Present' : status === 'Half' ? 'Half Day' : 'Absent/Leave'}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span>Order</span>
                                <select value={historySort} onChange={event => setHistorySort(event.target.value)}>
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                </select>
                            </label>
                            <button
                                type="button"
                                className="history-toolbar-button"
                                onClick={clearHistoryFilters}
                                disabled={historyDateFilter === 'all' && !historyStatusFilter && historySort === 'newest' && !historyFromDate && !historyToDate}
                            >
                                Clear filters
                            </button>
                            <button
                                type="button"
                                className="history-toolbar-button history-export-button"
                                onClick={exportAttendanceHistory}
                                disabled={filteredHistory.length === 0}
                            >
                                <FaDownload /> Export CSV
                            </button>
                            <button
                                type="button"
                                className="history-toolbar-button"
                                onClick={() => setHistoryRefreshToken(token => token + 1)}
                                disabled={loadingHistory}
                            >
                                {loadingHistory ? <FaSpinner className="inline-spinner" /> : <FaSyncAlt />} Refresh
                            </button>
                        </section>

                        {invalidHistoryDateRange && (
                            <div className="message-box error-message" role="alert">
                                The start date must be on or before the end date.
                            </div>
                        )}

                        <div className="staff-history-table-heading">
                            <h2 className="staff-history-heading">Attendance Records</h2>
                            <span>{filteredHistory.length} record{filteredHistory.length === 1 ? '' : 's'}</span>
                        </div>
                        {filteredHistory.length === 0 ? (
                            <div className="staff-history-state">
                                <FaUsers aria-hidden="true" />
                                <p>
                                    {attendanceHistory.length === 0
                                        ? 'No attendance records have been saved for this staff member.'
                                        : 'No attendance records match these filters.'}
                                </p>
                                {attendanceHistory.length > 0 && (
                                    <button type="button" className="history-toolbar-button" onClick={clearHistoryFilters}>
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="attendance-table-wrapper">
                                    <table className="attendance-table staff-history-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedHistory.map((record, index) => (
                                                <tr key={record._id || `${record.id}-${record.date}`}>
                                                    <td>{(currentHistoryPage - 1) * historyPageSize + index + 1}</td>
                                                    <td>{new Date(`${record.date}T00:00:00`).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}</td>
                                                    <td>
                                                        <span className={`staff-history-status ${String(record.status || '').toLowerCase()}`}>
                                                            {record.status === 'Full'
                                                                ? 'Present'
                                                                : record.status === 'Half'
                                                                    ? 'Half Day'
                                                                    : record.status === 'Leave'
                                                                        ? 'Absent/Leave'
                                                                        : record.status || 'Unknown'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="staff-history-pagination">
                                    <label>
                                        Rows per page
                                        <select
                                            value={historyPageSize}
                                            onChange={event => {
                                                setHistoryPageSize(Number(event.target.value));
                                                setHistoryPage(1);
                                            }}
                                        >
                                            {HISTORY_PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                                        </select>
                                    </label>
                                    <span className="staff-history-page-summary">
                                        {(currentHistoryPage - 1) * historyPageSize + 1}–{Math.min(currentHistoryPage * historyPageSize, filteredHistory.length)} of {filteredHistory.length}
                                    </span>
                                    <div className="staff-history-page-controls">
                                        <button
                                            type="button"
                                            className="history-toolbar-button"
                                            onClick={() => setHistoryPage(currentHistoryPage - 1)}
                                            disabled={currentHistoryPage === 1}
                                        >
                                            Previous
                                        </button>
                                        {historyPageNumbers.map((pageNumber, index) => (
                                            <React.Fragment key={pageNumber}>
                                                {index > 0 && pageNumber - historyPageNumbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
                                                <button
                                                    type="button"
                                                    className={`history-toolbar-button history-page-number ${pageNumber === currentHistoryPage ? 'selected' : ''}`}
                                                    aria-current={pageNumber === currentHistoryPage ? 'page' : undefined}
                                                    onClick={() => setHistoryPage(pageNumber)}
                                                >
                                                    {pageNumber}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                        <button
                                            type="button"
                                            className="history-toolbar-button"
                                            onClick={() => setHistoryPage(currentHistoryPage + 1)}
                                            disabled={currentHistoryPage === historyPageCount}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="attendance-container">
            <h1 className="attendance-title"><FaClock /> {staffId ? 'Staff Attendance' : 'Staff Daily Attendance'}</h1>
            
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

                <section className="attendance-spreadsheet-tools" aria-label="Attendance Excel tools">
                    <p>Select a month to download the attendance and salary report.</p>
                    <div className="attendance-spreadsheet-actions">
                        <label className="attendance-month-picker">
                            <span>Report month</span>
                            <input
                                type="month"
                                value={selectedMonth}
                                max={getLocalDate().slice(0, 7)}
                                onChange={event => setSelectedMonth(event.target.value)}
                                aria-label="Select month for attendance report"
                            />
                        </label>
                        <button
                            type="button"
                            className="attendance-spreadsheet-button monthly"
                            onClick={downloadMonthlyAttendanceSpreadsheet}
                            disabled={!selectedMonth || attendanceStaff.length === 0 || isDownloadingMonthlyReport}
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
                                <th>Staff Name</th>
                                <th>Present</th>
                                <th>Half Day</th>
                                <th>Absent/Leave</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record, index) => (
                                <tr key={record.id} className={record.status === 'Leave' ? 'status-leave' : ''}>
                                    <td>{index + 1}</td>
                                    <td className="staff-name-col">{attendanceStaff.find(m => String(m.id) === String(record.id))?.name || record.name || 'N/A'}</td>
                                    
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
                    disabled={isSaving || loadingAttendance || !selectedDate || attendanceStaff.length === 0 || records.length === 0}
                >
                    <FaSave /> {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
            </form>
        </div>
    );
};

export default StaffAttendance;