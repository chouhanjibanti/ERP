import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlus, FaSave, FaCheckCircle, FaExclamationCircle, FaUpload, FaDownload } from 'react-icons/fa';
import '../CSS/Test.css';

const parseCsv = (value) => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];

        if (inQuotes) {
            if (character === '"' && value[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                inQuotes = false;
            } else {
                field += character;
            }
        } else if (character === '"' && field.length === 0) {
            inQuotes = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n' || character === '\r') {
            row.push(field);
            if (row.some(cell => cell.trim())) rows.push(row);
            row = [];
            field = '';
            if (character === '\r' && value[index + 1] === '\n') index += 1;
        } else {
            field += character;
        }
    }

    if (inQuotes) {
        throw new Error('The CSV contains an unclosed quoted field.');
    }

    row.push(field);
    if (row.some(cell => cell.trim())) rows.push(row);
    return rows;
};

const normalizeHeader = (header) => header.trim().toLowerCase().replace(/[^a-z]/g, '');

const csvTemplate = [
    'question,optionA,optionB,optionC,optionD,correctAnswer,points',
    '"What is 2 + 2?",3,4,5,6,B,1',
].join('\r\n');

const createInitialQuestions = (count) => {
    if (count <= 0) return [];
    return Array.from({ length: count }, () => ({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '',
    }));
};

const Test = () => {
    const [quizTitle, setQuizTitle] = useState('New ERP Assessment');
    const [questionCount, setQuestionCount] = useState(3); 
    const [questions, setQuestions] = useState(createInitialQuestions(3));
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [messageType, setMessageType] = useState(''); 
    const [csvMessage, setCsvMessage] = useState('');
    const [csvMessageType, setCsvMessageType] = useState('');
    const csvInputRef = useRef(null);

    useEffect(() => {
        const newQuestions = createInitialQuestions(questionCount);
        setQuestions(prevQuestions => {
            const preservedQuestions = prevQuestions.slice(0, questionCount);
            return [
                ...preservedQuestions,
                ...newQuestions.slice(preservedQuestions.length)
            ];
        });
    }, [questionCount]);


    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, optionIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[optionIndex] = value;
        setQuestions(newQuestions);
    };

    const handleCorrectAnswerChange = (qIndex, option) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctAnswer = option;
        setQuestions(newQuestions);
    };

    const handleQuestionCountChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1 && value <= 50) { 
            setQuestionCount(value);
        } else if (e.target.value === '') {
            setQuestionCount(0);
        }
    };

    const handleCsvImport = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            const contents = (await file.text()).replace(/^\uFEFF/, '');
            const rows = parseCsv(contents);
            if (rows.length < 2) {
                throw new Error('Add a header row and at least one question to the CSV.');
            }

            const headers = rows[0].map(normalizeHeader);
            const column = (names) => headers.findIndex(header => names.includes(header));
            const columns = {
                question: column(['question', 'questiontext', 'text']),
                optionA: column(['optiona', 'a']),
                optionB: column(['optionb', 'b']),
                optionC: column(['optionc', 'c']),
                optionD: column(['optiond', 'd']),
                correctAnswer: column(['correctanswer', 'answer', 'correct']),
                points: column(['points', 'point']),
            };
            const requiredColumns = Object.entries(columns)
                .filter(([name]) => name !== 'points' && columns[name] === -1)
                .map(([name]) => name);

            if (requiredColumns.length) {
                throw new Error(`Missing required CSV columns: ${requiredColumns.join(', ')}.`);
            }

            const questionRows = rows.slice(1);
            if (questionRows.length > 50) {
                throw new Error(`The CSV has ${questionRows.length} questions; the limit is 50.`);
            }

            const importedQuestions = questionRows.map((row, index) => {
                const readCell = (columnIndex) => (row[columnIndex] || '').trim();
                const correctAnswer = readCell(columns.correctAnswer)
                    .replace(/^option\s*/i, '')
                    .toUpperCase();
                const text = readCell(columns.question);
                const options = [
                    readCell(columns.optionA),
                    readCell(columns.optionB),
                    readCell(columns.optionC),
                    readCell(columns.optionD),
                ];
                const rowNumber = index + 2;

                if (!text || options.some(option => !option)) {
                    throw new Error(`CSV row ${rowNumber}: question text and all four options are required.`);
                }
                if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
                    throw new Error(`CSV row ${rowNumber}: correctAnswer must be A, B, C, or D.`);
                }

                const pointsValue = columns.points === -1 ? '' : readCell(columns.points);
                const points = pointsValue ? Number(pointsValue) : 1;
                if (!Number.isFinite(points) || points <= 0) {
                    throw new Error(`CSV row ${rowNumber}: points must be a positive number.`);
                }

                return { text, options, correctAnswer, points };
            });

            setQuestions(importedQuestions);
            setQuestionCount(importedQuestions.length);
            setCsvMessage(`${importedQuestions.length} questions loaded. Review them below, then save the assessment.`);
            setCsvMessageType('success');
            setMessage('');
        } catch (error) {
            setCsvMessage(error.message || 'Unable to read this CSV file.');
            setCsvMessageType('error');
        }
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'assessment-questions-template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const validateQuiz = () => {
        if (!quizTitle.trim()) {
            setMessage('Quiz title is required.');
            setMessageType('error');
            return false;
        }
        if (questions.length === 0) {
            setMessage('Please enter a valid number of questions.');
            setMessageType('error');
            return false;
        }

        for (const [index, question] of questions.entries()) {
            if (!question.text.trim()) {
                setMessage(`Question ${index + 1}: Question text is missing.`);
                setMessageType('error');
                return false;
            }
            if (question.options.some(option => !option.trim())) {
                setMessage(`Question ${index + 1}: All four options must be filled.`);
                setMessageType('error');
                return false;
            }
            if (!question.correctAnswer) {
                setMessage(`Question ${index + 1}: Correct answer must be selected.`);
                setMessageType('error');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateQuiz()) return;

        setIsSaving(true);
        setMessage('');

        const quizData = {
            title: quizTitle,
            questions: questions.slice(0, questionCount).map(q => ({
                ...q,
                options: q.options.filter(opt => opt.trim() !== '') 
            }))
        };

        try {
            await axios.post('/api/addquestion', quizData);
            setMessage('Quiz successfully saved!');
            setMessageType('success');
            setQuestions(createInitialQuestions(questionCount));
            setQuizTitle('New ERP Assessment');
        } catch (error) {
            setMessage(`Error saving quiz: ${error.message || 'Server error'}`);
            setMessageType('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="quiz-page-container">
            <div className="quiz-form-wrapper">
                <h1 className="form-title">
                    <FaPlus /> Create New Assessment
                </h1>

                <section className="csv-import-section" aria-label="Bulk import questions">
                    <div className="csv-import-copy">
                        <h2>Bulk add questions with CSV</h2>
                        <p>Import up to 50 questions. Use the template and review the imported questions before saving.</p>
                    </div>
                    <div className="csv-import-actions">
                        <button type="button" className="csv-button csv-template-button" onClick={handleDownloadTemplate}>
                            <FaDownload /> Download CSV template
                        </button>
                        <button type="button" className="csv-button" onClick={() => csvInputRef.current?.click()}>
                            <FaUpload /> Choose CSV file
                        </button>
                        <input
                            ref={csvInputRef}
                            className="csv-file-input"
                            type="file"
                            accept=".csv,text/csv"
                            aria-label="Choose assessment questions CSV"
                            onChange={handleCsvImport}
                        />
                    </div>
                    {csvMessage && (
                        <p className={`message-box ${csvMessageType}`}>
                            {csvMessage}
                        </p>
                    )}
                </section>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group-top">
                        <div className="input-field title-field">
                            <label htmlFor="quizTitle">Assessment Title</label>
                            <input
                                id="quizTitle"
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="e.g., New ERP Assessment"
                                required
                            />
                        </div>
                        <div className="input-field count-field">
                            <label htmlFor="questionCount">Number of Questions (1-50)</label>
                            <input
                                id="questionCount"
                                type="number"
                                value={questionCount}
                                onChange={handleQuestionCountChange}
                                min="1"
                                max="50"
                                required
                            />
                        </div>
                    </div>
                    
                    {questions.slice(0, questionCount).map((q, index) => (
                        <div key={index} className="question-card">
                            <h3 className="question-header">Question {index + 1}</h3>
                            
                            <div className="input-field">
                                <label>Question Text</label>
                                <textarea
                                    rows="2"
                                    value={q.text}
                                    onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                                    placeholder="Enter the complete question text..."
                                    required
                                ></textarea>
                            </div>

                            <div className="options-grid">
                                {['A', 'B', 'C', 'D'].map((option, i) => (
                                    <div key={i} className="input-field option-input">
                                        <label>{`Option ${option}`}</label>
                                        <input
                                            type="text"
                                            value={q.options[i]}
                                            onChange={(e) => handleOptionChange(index, i, e.target.value)}
                                            placeholder={`Option ${option} text`}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="input-field correct-answer-select">
                                <label>Select Correct Answer</label>
                                <select
                                    value={q.correctAnswer}
                                    onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Choose the correct option (A, B, C, or D)</option>
                                    {['A', 'B', 'C', 'D'].map((option) => (
                                        <option key={option} value={option}>Option {option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                    {message && (
                        <p className={`message-box ${messageType}`}>
                            {messageType === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />} {message}
                        </p>
                    )}
                    
                    <button type="submit" disabled={isSaving || questionCount === 0} className="submit-button">
                        <FaSave /> {isSaving ? 'Saving Assessment...' : 'Save Quiz'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Test;