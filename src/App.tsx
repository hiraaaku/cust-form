import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerForm from './pages/CustomerForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

/**
 * Komponen untuk memproteksi rute admin.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik: Form Customer */}
        <Route path="/" element={<CustomerForm />} />

        {/* Rute Publik: Login Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Rute Terproteksi: Dashboard Admin */}
        <Route 
          path="/admin" 
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          } 
        />

        {/* Redirect rute tidak dikenal ke home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
