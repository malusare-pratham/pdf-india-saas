import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaDownload, FaCut } from 'react-icons/fa';
import { downloadProcessedFile, getFileDownloadUrl, splitPDF } from '../../service/api';
import './Split.css';

const Split = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);
    const [splitRange, setSplitRange] = useState('');

    const handleSplitUpload = async (files) => {
        if (!splitRange) {
            alert("Please enter a page range (e.g., 1-5 or 1,3,5)");
            return;
        }

        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        formData.append('file', files[0]); // Split usually works on a single file
        const [startRaw, endRaw] = splitRange.split('-').map((v) => v.trim());
        const startPage = Number(startRaw);
        const endPage = Number(endRaw || startRaw);

        if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) {
            setError('Please use a valid range format like 1-5');
            setLoading(false);
            return;
        }

        formData.append('startPage', startPage);
        formData.append('endPage', endPage);

        try {
            const data = await splitPDF(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Error splitting PDF. Check your page range and login.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, 'split_document.pdf');
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page">
            {loading && <Loader message="Extracting pages... Please wait." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle split-theme">
                        <FaCut />
                    </div>
                    <h1>Split PDF</h1>
                    <p>Extract specific pages or separate your PDF into multiple files.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <div className="range-input-container">
                            <label>Enter Page Range:</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 1-5 or 1, 3, 7" 
                                value={splitRange}
                                onChange={(e) => setSplitRange(e.target.value)}
                                className="range-input"
                            />
                        </div>

                        <FileUpload 
                            accept=".pdf" 
                            multiple={false} 
                            onUpload={handleSplitUpload}
                            title="Upload PDF to Split"
                            description="Select the PDF file you want to extract pages from."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="success-icon">✂️</div>
                            <h2>PDF Split Successfully!</h2>
                            <p>Your extracted pages are ready for download.</p>
                            <button
                                className="btn btn-primary btn-download"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download Result
                            </button>
                            <button 
                                className="btn-link" 
                                onClick={() => {
                                    setDownloadUrl(null);
                                    setSplitRange('');
                                }}
                            >
                                Split another file
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Split;
