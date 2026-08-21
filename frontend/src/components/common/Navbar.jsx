import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Sun,
  Moon,
} from 'lucide-react';

export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3.5 py-2 text-xs font-sans font-semibold uppercase tracking-wider transition-colors ${
      isActive
        ? 'bg-[#ebe5da] text-[#24211e] border-b-2 border-[#5f4b3b]'
        : 'text-[#6b665e] hover:text-[#24211e] hover:bg-[#ebe5da]/50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3.5 py-2.5 text-sm font-sans font-semibold transition-colors ${
      isActive
        ? 'bg-[#ebe5da] text-[#24211e] border-l-4 border-[#5f4b3b]'
        : 'text-[#6b665e] hover:text-[#24211e] hover:bg-[#ebe5da]/50'
    }`;

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-[#faf8f3] border-b border-[#d8cdbc] text-[#24211e] shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="flex items-center space-x-3 text-[#24211e] hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 bg-[#24211e] text-[#FAF8F5] border border-[#24211e] flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-sans font-semibold text-lg sm:text-xl tracking-tight hidden sm:inline text-[#24211e]">
                Socivio
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 font-sans">
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

          {/* User Profile Dropdown, Theme Toggle & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
              className="w-10 h-10 rounded-none bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] font-sans font-medium text-xs flex items-center justify-center shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4b3b]"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#e0a96d]" />
              ) : (
                <Moon className="w-4 h-4 text-[#FAF8F5]" />
              )}
            </button>

            {/* Square Profile Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="w-10 h-10 rounded-none bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] font-sans font-semibold text-xs tracking-wider flex items-center justify-center shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4b3b]"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.name || 'User avatar'}
                    className="w-full h-full rounded-none object-cover"
                  />
                ) : (
                  <span className="tracking-wider font-sans">{getUserInitials(user?.name)}</span>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 mt-2 w-64 bg-[#faf8f3] border border-[#d8cdbc] shadow-md z-50 rounded-none animate-in fade-in zoom-in-95 duration-100 text-[#24211e]"
                >
                  <div className="px-4 py-3.5 border-b border-[#d8cdbc]/60">
                    <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#8F8778] mb-0.5">
                      Name
                    </p>
                    <p className="font-serif text-base font-normal text-[#24211e] leading-snug break-words">
                      {user?.name || 'User'}
                    </p>

                    <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#8F8778] mt-3 mb-0.5">
                      Role
                    </p>
                    <p className="text-xs font-sans font-bold uppercase tracking-wider text-[#5f4b3b]">
                      {user?.role === 'ADMIN' ? 'ADMINISTRATOR' : 'RESIDENT'}
                    </p>
                    {user?.flat_no && user?.role !== 'ADMIN' && (
                      <p className="text-xs font-sans text-[#6b665e] mt-1">Flat {user.flat_no}</p>
                    )}
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      role="menuitem"
                      className="w-full flex items-center px-3 py-2 text-xs font-sans font-semibold uppercase tracking-wider text-[#8a4d43] hover:text-[#5f4b3b] hover:bg-[#ebe5da] transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2 text-[#8a4d43]" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 text-[#24211e] hover:bg-[#ebe5da] border border-[#d8cdbc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4b3b]"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#faf8f3] border-t border-[#d8cdbc] px-3 pt-3 pb-4 space-y-1 text-[#24211e]">
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
        </div>
      )}
    </nav>
  );
}
