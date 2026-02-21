import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaDownload, FaObjectGroup } from 'react-icons/fa';
import { downloadProcessedFile, getFileDownloadUrl, mergePDFs } from '../../service/api';
import './Merge.css';

const Merge = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleMergeUpload = async (files) => {
        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const data = await mergePDFs(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to merge PDFs. Please login and upload valid PDF files.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, 'merged_document.pdf');
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page">
            {loading && <Loader message="Merging your PDF files... Please wait." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle">
                        <FaObjectGroup />
                    </div>
                    <h1>Merge PDF Files</h1>
                    <p>Combine multiple PDFs into one document in seconds. 100% Secure.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <FileUpload 
                            accept=".pdf" 
                            multiple={true} 
                            onUpload={handleMergeUpload}
                            title="Select PDF Files"
                            description="Upload 2 or more PDFs to combine them into one."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="success-icon">🎉</div>
                            <h2>Files Merged Successfully!</h2>
                            <p>Your new PDF document is ready for download.</p>
                            <button
                                className="btn btn-primary btn-download"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download Merged PDF
                            </button>
                            <button 
                                className="btn-link" 
                                onClick={() => setDownloadUrl(null)}
                            >
                                Merge more files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Merge;
