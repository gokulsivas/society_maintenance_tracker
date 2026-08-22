import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestOnlyRoute from './components/common/GuestOnlyRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Resident & Shared Pages
import ResidentDashboardPage from './pages/ResidentDashboardPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import CreateComplaintPage from './pages/CreateComplaintPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import NoticeBoardPage from './pages/NoticeBoardPage';

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminComplaintsPage from './pages/AdminComplaintsPage';
import AdminNoticesPage from './pages/AdminNoticesPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function AuthenticatedLayout({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <div className="min-h-screen bg-[#f5f2ec] text-[#24211e] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Guest-Only Routes */}
          <Route
            path="/"
            element={
              <GuestOnlyRoute>
                <LandingPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/signin"
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />

          {/* Resident & Shared Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <AuthenticatedLayout>
                <ResidentDashboardPage />
              </AuthenticatedLayout>
            }
          />
          {/* Order matters: /complaints/new MUST come before /complaints/:id */}
          <Route
            path="/complaints/new"
            element={
              <AuthenticatedLayout>
                <CreateComplaintPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/new-complaint"
            element={
              <AuthenticatedLayout>
                <CreateComplaintPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/complaints/:id"
            element={
              <AuthenticatedLayout>
                <ComplaintDetailPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/complaints"
            element={
              <AuthenticatedLayout>
                <MyComplaintsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/notices"
            element={
              <AuthenticatedLayout>
                <NoticeBoardPage />
              </AuthenticatedLayout>
            }
          />

          {/* Admin-only Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AuthenticatedLayout adminOnly>
                <AdminDashboardPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <AuthenticatedLayout adminOnly>
                <AdminComplaintsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <AuthenticatedLayout adminOnly>
                <AdminNoticesPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AuthenticatedLayout adminOnly>
                <AdminSettingsPage />
              </AuthenticatedLayout>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
