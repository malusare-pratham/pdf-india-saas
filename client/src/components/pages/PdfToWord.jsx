import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaDownload, FaFileWord, FaExchangeAlt } from 'react-icons/fa';
import { convertToWord, downloadProcessedFile, getFileDownloadUrl } from '../../service/api';
import './PdfToWord.css';

const PdfToWord = () => {
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
            const data = await convertToWord(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Conversion failed. Please login and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, 'converted_document.docx');
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page">
            {loading && <Loader message="Converting PDF to Word... Retaining layout and text." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle word-theme">
                        <FaFileWord />
                    </div>
                    <h1>PDF to Word Converter</h1>
                    <p>Convert your PDF documents into editable DOCX files with high accuracy.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <FileUpload 
                            accept=".pdf" 
                            multiple={false} 
                            onUpload={handleConversion}
                            title="Upload PDF"
                            description="Select a PDF file to turn it into an editable Word document."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="conversion-success-icon">
                                <FaExchangeAlt />
                            </div>
                            <h2>Conversion Successful!</h2>
                            <p>Your editable Word file is ready to download.</p>
                            <button
                                className="btn btn-primary btn-download word-btn"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download Word File
                            </button>
                            <button 
                                className="btn-link" 
                                onClick={() => setDownloadUrl(null)}
                            >
                                Convert another file
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfToWord;
