import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Global reset and typography
import './App.css';   // Layout specific styles

// Create the root element using React 18 API
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* Note: StrictMode renders components twice in development 
        to help find bugs. It won't affect production.
    */}
    <App />
  </React.StrictMode>
);