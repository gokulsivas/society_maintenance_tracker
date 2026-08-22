import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

export function PublicLayout() {
  return (
    <GuestOnlyRoute>
      <Outlet />
    </GuestOnlyRoute>
  );
}

export function AuthenticatedLayout({ adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <div className="min-h-screen bg-[#f5f2ec] text-[#24211e] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Guest-Only Routes (Structurally Isolated from Authenticated Layout) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<RegisterPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Resident & Shared Protected Routes */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<ResidentDashboardPage />} />
            <Route path="/complaints/new" element={<CreateComplaintPage />} />
            <Route path="/new-complaint" element={<CreateComplaintPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="/complaints" element={<MyComplaintsPage />} />
            <Route path="/notices" element={<NoticeBoardPage />} />
          </Route>

          {/* Admin-Only Protected Routes */}
          <Route element={<AuthenticatedLayout adminOnly />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="/admin/notices" element={<AdminNoticesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

