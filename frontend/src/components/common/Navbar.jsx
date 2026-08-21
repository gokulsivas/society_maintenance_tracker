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
    `inline-flex items-center px-3.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#ebe5da] text-[#24211e] font-semibold border-b-2 border-[#5f4b3b]'
        : 'text-[#6b665e] hover:text-[#24211e] hover:bg-[#ebe5da]/50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3.5 py-2.5 text-base font-medium transition-colors ${
      isActive
        ? 'bg-[#ebe5da] text-[#24211e] font-semibold border-l-4 border-[#5f4b3b]'
        : 'text-[#6b665e] hover:text-[#24211e] hover:bg-[#ebe5da]/50'
    }`;

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#d8cdbc] text-[#24211e] shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="flex items-center space-x-3 text-[#24211e] hover:opacity-85 transition-opacity"
            >
              <div className="w-8 h-8 bg-[#24211e] text-[#FAF8F5] flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-serif font-medium text-xl tracking-tight hidden sm:inline">
                Socivio
              </span>
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
            <div className="flex items-center space-x-2.5 bg-[#ebe5da] px-3.5 py-1.5 border border-[#d8cdbc] text-xs">
              {isAdmin ? (
                <ShieldCheck className="h-4 w-4 text-[#5f4b3b]" />
              ) : (
                <UserIcon className="h-4 w-4 text-[#5f4b3b]" />
              )}
              <div className="flex flex-col text-left">
                <span className="font-semibold text-[#24211e] leading-tight">{user?.name}</span>
                <span className="text-[#6b665e] text-[10px] uppercase tracking-wider leading-tight">
                  {isAdmin ? 'Administrator' : `Flat ${user?.flat_no || 'Resident'}`}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3.5 py-2 text-xs font-medium bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-[#24211e] hover:bg-[#ebe5da] border border-[#d8cdbc] focus:outline-none"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-t border-[#d8cdbc] px-3 pt-3 pb-4 space-y-1">
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
          <div className="pt-4 pb-2 border-t border-[#d8cdbc] space-y-3">
            <div className="px-3.5 py-2 bg-[#ebe5da] border border-[#d8cdbc] text-xs text-[#6b665e]">
              Signed in as <strong className="text-[#24211e]">{user?.name}</strong> ({user?.role})
            </div>
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e]"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
