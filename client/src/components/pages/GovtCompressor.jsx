import React, { useState } from 'react';
import FileUpload from '../tools/FileUpload';
import Loader from '../layout/Loader';
import { FaDownload, FaUserShield, FaIdCard } from 'react-icons/fa';
import { downloadProcessedFile, getFileDownloadUrl, govtResize } from '../../service/api';
import './GovtCompressor.css';

const GovtCompressor = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);
    const [preset, setPreset] = useState('upsc_photo');

    const presets = {
        upsc_photo: { name: "UPSC/SSC Photo", desc: "Target: 100KB", targetSize: '100' },
        upsc_sign: { name: "UPSC/SSC Signature", desc: "Target: 100KB", targetSize: '100' },
        ibps_photo: { name: "IBPS Photo", desc: "Target: 200KB", targetSize: '200' },
        passport_size: { name: "Passport Size", desc: "Target: 500KB", targetSize: '500' }
    };

    const handleGovtResize = async (files) => {
        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('targetSize', presets[preset].targetSize);
        formData.append('examType', preset);

        try {
            const data = await govtResize(formData);
            setDownloadUrl(getFileDownloadUrl(data.downloadUrl));
        } catch (err) {
            setError(err.response?.data?.message || "Resizing failed. Please login and upload a valid PDF.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadProcessedFile(downloadUrl, `govt_ready_${preset}.pdf`);
        } catch (err) {
            setError(err.message || 'Download failed.');
        }
    };

    return (
        <div className="tool-page">
            {loading && <Loader message="Applying Govt portal dimensions... Please wait." />}

            <div className="container">
                <div className="tool-header">
                    <div className="tool-icon-circle govt-theme">
                        <FaUserShield />
                    </div>
                    <h1>Govt Form Resizer</h1>
                    <p>Instantly resize Photos & Signatures for Indian Government Exam portals.</p>
                </div>

                {!downloadUrl ? (
                    <div className="upload-section">
                        <div className="preset-grid">
                            {Object.keys(presets).map((key) => (
                                <div 
                                    key={key} 
                                    className={`preset-card ${preset === key ? 'active' : ''}`}
                                    onClick={() => setPreset(key)}
                                >
                                    <FaIdCard className="preset-icon" />
                                    <h4>{presets[key].name}</h4>
                                    <span>{presets[key].desc}</span>
                                </div>
                            ))}
                        </div>

                        <FileUpload 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            multiple={false} 
                            onUpload={handleGovtResize}
                            title={`Upload for ${presets[preset].name}`}
                            description="Upload PDF or image. It will be auto-processed for the selected Govt size criteria."
                        />
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="success-card">
                            <div className="success-icon govt-success">✅</div>
                            <h2>Ready for Portal Upload!</h2>
                            <p>Your file has been resized to the exact dimensions and size limits.</p>
                            <button
                                className="btn btn-primary btn-download govt-btn"
                                onClick={handleDownload}
                            >
                                <FaDownload /> Download Resized File
                            </button>
                            <button 
                                className="btn-link" 
                                onClick={() => setDownloadUrl(null)}
                            >
                                Resize another document
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GovtCompressor;
