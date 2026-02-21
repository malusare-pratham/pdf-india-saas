import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaFilePdf, FaTimes, FaCheckCircle } from 'react-icons/fa';
import './FileUpload.css';

const FileUpload = ({ accept, multiple, onUpload, title, description }) => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // फाईल निवडल्यावर हँडल करणे
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    // Drag & Drop हँडलर्स
    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    // फाईल रिमूव्ह करणे
    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (files.length > 0) {
            onUpload(files);
        } else {
            alert("कृपया किमान एक फाईल निवडा!");
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <h2>{title || "Upload Files"}</h2>
                <p>{description || "Select or drag and drop your documents here"}</p>
            </div>

            <div 
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current.click()}
            >
                <input 
                    type="file" 
                    multiple={multiple} 
                    accept={accept} 
                    hidden 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <FaCloudUploadAlt className="upload-icon" />
                <p>Click or Drag & Drop files here</p>
                <span>Supported: PDF, JPG, PNG, DOCX (Max 20MB)</span>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
                <div className="file-list">
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            <FaFilePdf className="pdf-icon" />
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <FaTimes className="remove-icon" onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                            }} />
                        </div>
                    ))}
                    
                    <button className="btn-upload-submit" onClick={handleSubmit}>
                        <FaCheckCircle /> Process Now
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;