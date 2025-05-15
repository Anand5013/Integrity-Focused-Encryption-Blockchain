import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import NotFound from './pages/NotFound';

// Import styles
import './App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Web3Provider>
          <div className="app-container d-flex flex-column min-vh-100">
            <Navbar />
            
            <main className="flex-grow-1">
              <Suspense fallback={<div className="container py-5"><LoadingSpinner message="Loading..." /></div>}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <PrivateRoute requiredRole="admin">
                        <AdminDashboard />
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient" 
                    element={
                      <PrivateRoute requiredRole="patient">
                        <PatientDashboard />
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Redirect from /dashboard to appropriate role-based dashboard */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        {(user: { role: string }) => (
                          <Navigate 
                            to={user?.role === 'admin' ? '/admin' : '/patient'} 
                            replace 
                          />
                        )}
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* 404 - Not Found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            
            <Footer />
          </div>
        </Web3Provider>
      </AuthProvider>
    </Router>
  );
};

export default App;