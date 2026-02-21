import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaDownload, FaCompressArrowsAlt, FaWeightHanging } from 'react-icons/fa';
import { compressPDF, downloadProcessedFile, getFileDownloadUrl } from '../../service/api';
import './Compress.css';

const Compress = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);
    const [compressionLevel, setCompressionLevel] = useState('medium');
    const [targetSizeMB, setTargetSizeMB] = useState('');
    const [targetSizeUnit, setTargetSizeUnit] = useState('MB');

    const handleCompressUpload = async (files) => {
        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('compressionLevel', compressionLevel);
        if (targetSizeMB) {
            const sizeValue = Number(targetSizeMB);
            const sizeInMB = targetSizeUnit === 'KB' ? (sizeValue / 1024) : sizeValue;
            formData.append('targetSizeMB', sizeInMB);
        }

        try {
            const data = await compressPDF(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Compression failed. Please login and upload a valid PDF.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, 'compressed_document.pdf');
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page">
            {loading && <Loader message="Reducing file size... Optimization in progress." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle compress-theme">
                        <FaCompressArrowsAlt />
                    </div>
                    <h1>Compress PDF</h1>
                    <p>Reduce the size of your PDF documents while maintaining the best quality.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <div className="options-container">
                            <label className="options-label">Select Compression Level:</label>
                            <div className="compression-options">
                                <button 
                                    className={`opt-btn ${compressionLevel === 'extreme' ? 'active' : ''}`}
                                    onClick={() => setCompressionLevel('extreme')}
                                >
                                    Extreme <span>(Less Quality)</span>
                                </button>
                                <button 
                                    className={`opt-btn ${compressionLevel === 'medium' ? 'active' : ''}`}
                                    onClick={() => setCompressionLevel('medium')}
                                >
                                    Recommended <span>(Good Quality)</span>
                                </button>
                                <button 
                                    className={`opt-btn ${compressionLevel === 'low' ? 'active' : ''}`}
                                    onClick={() => setCompressionLevel('low')}
                                >
                                    Low <span>(High Quality)</span>
                                </button>
                            </div>
                            <div className="target-size-row">
                                <label htmlFor="targetSizeMB" className="options-label">Target Size - Optional:</label>
                                <div className="target-size-controls">
                                    <input
                                        id="targetSizeMB"
                                        type="number"
                                        min={targetSizeUnit === 'KB' ? '50' : '0.1'}
                                        step={targetSizeUnit === 'KB' ? '10' : '0.1'}
                                        placeholder={targetSizeUnit === 'KB' ? 'e.g. 500' : 'e.g. 2.5'}
                                        value={targetSizeMB}
                                        onChange={(e) => setTargetSizeMB(e.target.value)}
                                        className="target-size-input"
                                    />
                                    <select
                                        className="target-size-unit"
                                        value={targetSizeUnit}
                                        onChange={(e) => setTargetSizeUnit(e.target.value)}
                                    >
                                        <option value="MB">MB</option>
                                        <option value="KB">KB</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <FileUpload 
                            accept=".pdf" 
                            multiple={false} 
                            onUpload={handleCompressUpload}
                            title="Upload PDF to Compress"
                            description="Select a PDF file to reduce its size for faster sharing."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="success-icon"><FaWeightHanging /></div>
                            <h2>Optimization Complete!</h2>
                            <p>Your compressed PDF is ready for download.</p>
                            <button
                                className="btn btn-primary btn-download"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download Optimized PDF
                            </button>
                            <button 
                                className="btn-link" 
                                onClick={() => setDownloadUrl(null)}
                            >
                                Compress another file
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Compress;
