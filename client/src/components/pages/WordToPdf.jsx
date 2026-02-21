import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaDownload, FaFilePdf, FaFileWord, FaArrowRight } from 'react-icons/fa';
import { convertToPdf, downloadProcessedFile, getFileDownloadUrl } from '../../service/api';
import './WordToPdf.css';

const WordToPdf = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleConversion = async (files) => {
        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const data = await convertToPdf(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Conversion failed. Please login and upload a valid .doc/.docx file.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, 'converted_document.pdf');
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page">
            {loading && <Loader message="Converting Word to PDF... Preserving fonts and formatting." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle word-to-pdf-theme">
                        <FaFileWord className="icon-word" />
                        <FaArrowRight className="icon-arrow" />
                        <FaFilePdf className="icon-pdf" />
                    </div>
                    <h1>Word to PDF Converter</h1>
                    <p>Make your DOC and DOCX files easy to read by converting them to PDF.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <FileUpload 
                            accept=".doc,.docx" 
                            multiple={false} 
                            onUpload={handleConversion}
                            title="Upload Word Document"
                            description="Select the Word file you want to convert to a high-quality PDF."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="success-visual">
                                <FaFilePdf className="final-pdf-icon" />
                            </div>
                            <h2>Conversion Complete!</h2>
                            <p>Your PDF file is ready for download.</p>
                            <button
                                className="btn btn-primary btn-download pdf-btn"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download PDF
                            </button>
                            <button 
                                className="btn-link" 
                                onClick={() => setDownloadUrl(null)}
                            >
                                Convert another document
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordToPdf;
