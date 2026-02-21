import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaGraduationCap, FaFileSignature, FaIdBadge, FaDownload, FaBookOpen } from 'react-icons/fa';
import { downloadProcessedFile, getFileDownloadUrl, studentMode } from '../../service/api';
import './StudentMode.css';

const StudentMode = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);
    const [activeTool, setActiveTool] = useState('assignment');

    const studentTools = {
        assignment: { 
            name: "Assignment Maker", 
            desc: "Combine photos of handwritten pages into one clean PDF.",
            btnText: "Create Assignment PDF"
        },
        id_card: { 
            name: "ID Card Resizer", 
            desc: "Resize college ID or Aadhar for online scholarship forms.",
            btnText: "Resize ID Card"
        },
        hall_ticket: { 
            name: "Hall Ticket Optimizer", 
            desc: "Compress large hall ticket PDFs for fast WhatsApp sharing.",
            btnText: "Optimize Ticket"
        }
    };

    const handleStudentAction = async (files) => {
        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('scanClean', activeTool === 'assignment' ? 'true' : 'false');
        formData.append('autoMargin', activeTool === 'assignment' ? 'true' : 'false');
        formData.append('brightness', activeTool === 'hall_ticket' ? '1.1' : '1.2');

        try {
            const data = await studentMode(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Processing failed. Please login and retry.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, `student_${activeTool}.pdf`);
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page student-page">
            {loading && <Loader message="Processing your academic documents..." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle student-theme">
                        <FaGraduationCap />
                    </div>
                    <h1>Student Mode</h1>
                    <p>Simplified document tools for Indian Students & Scholars.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <div className="student-nav">
                            {Object.keys(studentTools).map((key) => (
                                <button 
                                    key={key}
                                    className={`student-nav-btn ${activeTool === key ? 'active' : ''}`}
                                    onClick={() => setActiveTool(key)}
                                >
                                    {key === 'assignment' && <FaBookOpen />}
                                    {key === 'id_card' && <FaIdBadge />}
                                    {key === 'hall_ticket' && <FaFileSignature />}
                                    {studentTools[key].name}
                                </button>
                            ))}
                        </div>

                        <div className="student-info-box">
                            <h4>{studentTools[activeTool].name}</h4>
                            <p>{studentTools[activeTool].desc}</p>
                        </div>

                        <FileUpload 
                            accept={activeTool === 'assignment' ? "image/*,.pdf" : ".jpg,.jpeg,.png,.pdf"} 
                            multiple={activeTool === 'assignment'} 
                            onUpload={handleStudentAction}
                            title={`Upload ${studentTools[activeTool].name} Files`}
                            description="Select images or documents from your phone or PC."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="success-icon student-success">🎓</div>
                            <h2>Academic PDF Ready!</h2>
                            <p>Your document is optimized and ready for submission.</p>
                            <button
                                className="btn btn-primary btn-download student-btn"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download Now
                            </button>
                            <button className="btn-link" onClick={() => setDownloadUrl(null)}>
                                Process another document
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentMode;
