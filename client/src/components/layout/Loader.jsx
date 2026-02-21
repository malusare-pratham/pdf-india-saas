import React from 'react';
import './Loader.css';

const Loader = ({ message = "प्रक्रिया सुरू आहे, कृपया प्रतीक्षा करा..." }) => {
    return (
        <div className="loader-overlay">
            <div className="loader-container">
                <div className="spinner">
                    <div className="double-bounce1"></div>
                    <div className="double-bounce2"></div>
                </div>
                <p className="loader-text">{message}</p>
                <div className="progress-dots">
                    <span>.</span><span>.</span><span>.</span>
                </div>
            </div>
        </div>
    );
};

export default Loader;