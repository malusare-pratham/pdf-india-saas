import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Context Provider
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Dashboard from './components/pages/Dashboard';
import Pricing from './components/pages/Pricing';

// Admin Components (NEW)
import AdminDashboard from './components/admin/AdminDashboard';

// Tool Components
import Merge from './components/pages/Merge';
import Split from './components/pages/Split';
import Compress from './components/pages/Compress';
import PdfToWord from './components/pages/PdfToWord';
import WordToPdf from './components/pages/WordToPdf';
import GovtCompressor from './components/pages/GovtCompressor';
import StudentMode from './components/pages/StudentMode';

// Protected Route Component (User)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; 
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

// Admin Route Component (NEW - Only for Admin)
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  // युजर लॉगिन पाहिजे आणि त्याचा रोल 'admin' असायला हवा
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="app-wrapper">
          <Navbar />
          
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/all-tools" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<Login />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* PDF Tool Routes */}
              <Route path="/merge-pdf" element={<Merge />} />
              <Route path="/split-pdf" element={<Split />} />
              <Route path="/compress-pdf" element={<Compress />} />
              <Route path="/pdf-to-word" element={<PdfToWord />} />
              <Route path="/word-to-pdf" element={<WordToPdf />} />
              <Route path="/govt-resize" element={<GovtCompressor />} />
              <Route path="/student-mode" element={<StudentMode />} />

              {/* User Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Protected Routes (NEW) */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />

              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
