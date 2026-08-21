import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-base font-medium ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
    }`;

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="flex items-center space-x-2.5 font-bold text-lg text-white hover:opacity-90"
            >
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="tracking-tight hidden sm:inline">Socivio</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {!isAdmin ? (
              // Resident Links
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Dashboard
                </NavLink>
                <NavLink to="/complaints" end className={navLinkClass}>
                  <ClipboardList className="h-4 w-4 mr-1.5" />
                  My Complaints
                </NavLink>
                <NavLink to="/complaints/new" className={navLinkClass}>
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  New Complaint
                </NavLink>
                <NavLink to="/notices" className={navLinkClass}>
                  <Bell className="h-4 w-4 mr-1.5" />
                  Notices
                </NavLink>
              </>
            ) : (
              // Admin Links
              <>
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Dashboard
                </NavLink>
                <NavLink to="/admin/complaints" className={navLinkClass}>
                  <ClipboardList className="h-4 w-4 mr-1.5" />
                  Complaints
                </NavLink>
                <NavLink to="/admin/notices" className={navLinkClass}>
                  <Bell className="h-4 w-4 mr-1.5" />
                  Notices
                </NavLink>
                <NavLink to="/admin/settings" className={navLinkClass}>
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                </NavLink>
              </>
            )}
          </div>

          {/* User Badge & Logout */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-800 text-xs">
              {isAdmin ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <UserIcon className="h-4 w-4 text-blue-300" />
              )}
              <div className="flex flex-col text-left">
                <span className="font-semibold text-white leading-tight">{user?.name}</span>
                <span className="text-blue-300 text-[10px] leading-tight">
                  {isAdmin ? 'Administrator' : `Flat ${user?.flat_no || 'Resident'}`}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-600/80 hover:bg-red-600 text-white transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800 focus:outline-none"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-950 border-t border-blue-800 px-2 pt-2 pb-3 space-y-1">
          {!isAdmin ? (
            <>
              <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/complaints" end onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                My Complaints
              </NavLink>
              <NavLink to="/complaints/new" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                New Complaint
              </NavLink>
              <NavLink to="/notices" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Notices
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/complaints" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                All Complaints
              </NavLink>
              <NavLink to="/admin/notices" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Manage Notices
              </NavLink>
              <NavLink to="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Settings
              </NavLink>
            </>
          )}
          <div className="pt-4 pb-2 border-t border-blue-800">
            <div className="px-3 py-1 mb-2 text-sm text-blue-200">
              Signed in as <strong className="text-white">{user?.name}</strong> ({user?.role})
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900/40"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
