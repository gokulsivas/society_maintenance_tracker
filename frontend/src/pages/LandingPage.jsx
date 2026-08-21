import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Bell,
  ShieldCheck,
  Menu,
  X,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authDestination = isAuthenticated
    ? isAdmin
      ? '/admin/dashboard'
      : '/dashboard'
    : '/login';

  // Smooth in-page scrolling with prefers-reduced-motion respect
  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReduced ? 'auto' : 'smooth';

    if (targetId === 'home') {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior });
      }
    } else {
      const element = document.getElementById(targetId);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior, block: 'start' });
      }
    }

    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1E1C] font-sans selection:bg-[#E2DDD2] selection:text-[#1F1E1C]">
      {/* 1. HEADER */}
      <header
        className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE5DC]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Wordmark (clicks smoothly to top) */}
          <a
            href="#home"
            onClick={(e) => handleScrollTo(e, 'home')}
            className="flex items-center space-x-3 text-[#1F1E1C] hover:opacity-80 transition-opacity"
            aria-label="Society Maintenance Tracker - Return to Top"
          >
            <div className="w-8 h-8 bg-[#1F1E1C] text-[#FAF8F5] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-serif font-medium text-lg sm:text-xl tracking-tight">
              Society Maintenance Tracker
            </span>
          </a>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#5C5955]">
            <a
              href="#home"
              onClick={(e) => handleScrollTo(e, 'home')}
              className="hover:text-[#1F1E1C] transition-colors py-2"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleScrollTo(e, 'how-it-works')}
              className="hover:text-[#1F1E1C] transition-colors py-2"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={(e) => handleScrollTo(e, 'features')}
              className="hover:text-[#1F1E1C] transition-colors py-2"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={(e) => handleScrollTo(e, 'about')}
              className="hover:text-[#1F1E1C] transition-colors py-2"
            >
              About
            </a>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-5">
            <Link
              to={authDestination}
              className="text-sm font-medium text-[#5C5955] hover:text-[#1F1E1C] transition-colors px-2 py-2"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Sign in'}
            </Link>
            <Link
              to={isAuthenticated ? authDestination : '/register'}
              className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#1F1E1C] text-[#FAF8F5] hover:bg-[#383633] transition-all border border-[#1F1E1C]"
            >
              {isAuthenticated ? 'Open Portal' : 'Get started'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-[#1F1E1C] hover:bg-[#EAE5DC] border border-[#DDD6C8] transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-b border-[#EAE5DC] px-6 py-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-base font-medium text-[#5C5955]">
              <a
                href="#home"
                onClick={(e) => handleScrollTo(e, 'home')}
                className="py-1.5 hover:text-[#1F1E1C]"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleScrollTo(e, 'how-it-works')}
                className="py-1.5 hover:text-[#1F1E1C]"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={(e) => handleScrollTo(e, 'features')}
                className="py-1.5 hover:text-[#1F1E1C]"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={(e) => handleScrollTo(e, 'about')}
                className="py-1.5 hover:text-[#1F1E1C]"
              >
                About
              </a>
            </nav>
            <div className="pt-4 border-t border-[#EAE5DC] flex flex-col space-y-3">
              <Link
                to={authDestination}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-[#1F1E1C] border border-[#DDD6C8]"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Sign in'}
              </Link>
              <Link
                to={isAuthenticated ? authDestination : '/register'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#1F1E1C] text-[#FAF8F5] border border-[#1F1E1C]"
              >
                {isAuthenticated ? 'Open Portal' : 'Get started'}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section
        id="home"
        className="scroll-mt-24 pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column (Begins directly with h1 headline) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#1F1E1C] leading-[1.12]">
              A calmer way to care for your society.
            </h1>

            <p className="text-lg sm:text-xl text-[#5C5955] font-normal leading-relaxed max-w-xl">
              Report maintenance requests, follow their progress, and keep every resident informed
              in one thoughtful workspace.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              <Link
                to={isAuthenticated ? authDestination : '/register'}
                className="inline-flex items-center justify-center px-8 py-3.5 font-medium text-sm bg-[#1F1E1C] hover:bg-[#383633] text-[#FAF8F5] border border-[#1F1E1C] transition-all"
              >
                Get started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <a
                href="#features"
                onClick={(e) => handleScrollTo(e, 'features')}
                className="inline-flex items-center justify-center text-sm font-medium text-[#1F1E1C] hover:text-[#5C5955] transition-colors py-3 group"
              >
                Explore the platform
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: Realistic Architectural Photography in Sharp Frame */}
          <div className="lg:col-span-6 relative">
            <div className="bg-white p-2.5 sm:p-3.5 border border-[#DDD6C8] shadow-sm relative">
              <img
                src="/assets/hero_apartment.jpg"
                alt="Modern apartment society exterior with landscaped entrance"
                className="w-full h-[320px] sm:h-[420px] object-cover"
                loading="eager"
              />

              {/* Minimalist Sharp Floating Status Badge */}
              <div className="absolute bottom-6 left-6 bg-[#FAF8F5]/95 backdrop-blur-md px-4 py-3 border border-[#DDD6C8] shadow-sm flex items-center space-x-3">
                <div className="w-7 h-7 bg-[#EBE6DC] flex items-center justify-center text-[#6E7364]">
                  <CheckCircle2 className="w-4 h-4 text-[#6E7364]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1F1E1C]">12 requests resolved</p>
                  <p className="text-[11px] text-[#6E7364] uppercase tracking-wider font-medium">
                    This month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OVERLAPPING INFORMATION PANEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-20">
        <div className="bg-[#EBE6DC] border border-[#DDD6C8] p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Visual (Architectural Detail Photo) */}
            <div className="md:col-span-4 border border-[#D5CDBC] bg-white">
              <img
                src="/assets/maintenance_detail.jpg"
                alt="Natural architectural materials and clean interior detailing"
                className="w-full h-44 sm:h-52 object-cover"
                loading="lazy"
              />
            </div>

            {/* Middle Statement */}
            <div className="md:col-span-5 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6E7364]">
                Thoughtful maintenance
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1F1E1C] font-normal leading-snug">
                Better communication. Happier communities.
              </h2>
              <p className="text-sm sm:text-base text-[#5C5955] leading-relaxed">
                One shared place for residents and administrators to keep everyday requests moving.
              </p>
            </div>

            {/* Right Metric & Indicators */}
            <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end space-y-4 pt-4 md:pt-0 border-t md:border-t-0 border-[#D5CDBC]">
              <div className="flex -space-x-1 overflow-hidden">
                <div className="inline-block h-8 w-8 bg-[#1F1E1C] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center border border-[#EBE6DC]">
                  AD
                </div>
                <div className="inline-block h-8 w-8 bg-[#6E7364] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center border border-[#EBE6DC]">
                  RE
                </div>
                <div className="inline-block h-8 w-8 bg-[#8F8778] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center border border-[#EBE6DC]">
                  MT
                </div>
              </div>

              <div>
                <p className="font-serif text-4xl sm:text-5xl font-normal text-[#1F1E1C] leading-none">
                  12m
                </p>
                <p className="text-xs uppercase tracking-wider text-[#6E7364] font-semibold mt-1">
                  requests managed
                </p>
              </div>

              <a
                href="#features"
                onClick={(e) => handleScrollTo(e, 'features')}
                className="text-xs font-bold text-[#1F1E1C] hover:text-[#6E7364] transition-colors inline-flex items-center gap-1 uppercase tracking-wider"
              >
                Learn more
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE-STEP WORKFLOW SECTION */}
      <section
        id="how-it-works"
        className="scroll-mt-24 py-20 sm:py-28 bg-[#F3EFE8] border-y border-[#EAE5DC]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6E7364]">
              Process
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1F1E1C] font-normal tracking-tight">
              From request to resolution.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 01 */}
            <div className="space-y-4 border-t border-[#D5CDBC] pt-6">
              <span className="font-serif text-4xl sm:text-5xl text-[#8F8778] font-light">
                01
              </span>
              <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">Submit</h3>
              <p className="text-[#5C5955] text-base leading-relaxed">
                Residents describe an issue and send it to the right place.
              </p>
            </div>

            {/* Step 02 */}
            <div className="space-y-4 border-t border-[#D5CDBC] pt-6">
              <span className="font-serif text-4xl sm:text-5xl text-[#8F8778] font-light">
                02
              </span>
              <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">Track</h3>
              <p className="text-[#5C5955] text-base leading-relaxed">
                Everyone can understand what is open, in progress, or resolved.
              </p>
            </div>

            {/* Step 03 */}
            <div className="space-y-4 border-t border-[#D5CDBC] pt-6">
              <span className="font-serif text-4xl sm:text-5xl text-[#8F8778] font-light">
                03
              </span>
              <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">Resolve</h3>
              <p className="text-[#5C5955] text-base leading-relaxed">
                Administrators keep the community moving with clear next actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES SECTION */}
      <section
        id="features"
        className="scroll-mt-24 py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6E7364]">
            Capabilities
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1F1E1C] font-normal tracking-tight">
            Everything your community needs to stay in sync.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <div className="bg-[#FAF8F5] p-8 sm:p-10 border border-[#EAE5DC] hover:border-[#DDD6C8] transition-all space-y-4">
            <div className="w-10 h-10 bg-[#EAE5DC] flex items-center justify-center text-[#1F1E1C]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">
              Report without the back-and-forth
            </h3>
            <p className="text-[#5C5955] text-base leading-relaxed">
              Residents can submit clear maintenance requests with the details administrators need.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#EBE6DC]/60 p-8 sm:p-10 border border-[#DDD6C8] hover:border-[#CCC3B2] transition-all space-y-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center text-[#1F1E1C]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">
              Know what is happening
            </h3>
            <p className="text-[#5C5955] text-base leading-relaxed">
              Track complaint status, priority, and progress from submission to resolution.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#EBE6DC]/60 p-8 sm:p-10 border border-[#DDD6C8] hover:border-[#CCC3B2] transition-all space-y-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center text-[#1F1E1C]">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">
              Keep everyone informed
            </h3>
            <p className="text-[#5C5955] text-base leading-relaxed">
              Publish important society notices in one visible, organized place.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#FAF8F5] p-8 sm:p-10 border border-[#EAE5DC] hover:border-[#DDD6C8] transition-all space-y-4">
            <div className="w-10 h-10 bg-[#EAE5DC] flex items-center justify-center text-[#1F1E1C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl text-[#1F1E1C] font-normal">
              Give administrators clarity
            </h3>
            <p className="text-[#5C5955] text-base leading-relaxed">
              Review requests, manage priorities, update statuses, and understand recurring issues.
            </p>
          </div>
        </div>
      </section>

      {/* 6. ROLE PREVIEW SECTION */}
      <section
        id="about"
        className="scroll-mt-24 py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#EAE5DC]"
      >
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6E7364]">
            Roles & Access
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1E1C] font-normal tracking-tight">
            Designed for every member of the society.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Resident Experience Card */}
          <div className="bg-white p-8 sm:p-10 border border-[#EAE5DC] flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-4">
                <span className="font-serif text-2xl text-[#1F1E1C] font-normal">Resident</span>
                <span className="text-xs font-semibold px-3 py-1 bg-[#F4F1EA] text-[#6E7364] uppercase tracking-wider border border-[#EAE5DC]">
                  Community Member
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#5C5955]">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#6E7364]" />
                  <span>Report complaints with optional photo uploads.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#6E7364]" />
                  <span>Track personal requests and resolution history.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#6E7364]" />
                  <span>Read official society notices and alerts.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#6E7364]" />
                  <span>View resident dashboard with active ticket counts.</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold uppercase tracking-wider bg-[#F4F1EA] hover:bg-[#EAE5DC] text-[#1F1E1C] border border-[#DDD6C8] transition-all"
              >
                Resident experience
                <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Administrator Experience Card */}
          <div className="bg-[#EBE6DC] p-8 sm:p-10 border border-[#DDD6C8] flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#DDD6C8] pb-4">
                <span className="font-serif text-2xl text-[#1F1E1C] font-normal">Administrator</span>
                <span className="text-xs font-semibold px-3 py-1 bg-white text-[#1F1E1C] uppercase tracking-wider border border-[#DDD6C8]">
                  Management
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#5C5955]">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#1F1E1C]" />
                  <span>Review all complaints across the complex.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#1F1E1C]" />
                  <span>Change ticket status and prioritize urgent items.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#1F1E1C]" />
                  <span>Publish announcements with broadcast notifications.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#1F1E1C]" />
                  <span>View society-wide metrics and overdue SLA status.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#1F1E1C]" />
                  <span>Manage dynamic administrative threshold settings.</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold uppercase tracking-wider bg-[#1F1E1C] hover:bg-[#383633] text-[#FAF8F5] border border-[#1F1E1C] transition-all"
              >
                Admin experience
                <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1F1E1C] text-[#FAF8F5] p-10 sm:p-16 text-center space-y-6 sm:space-y-8 border border-[#1F1E1C]">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight max-w-2xl mx-auto">
            Make everyday community management feel simpler.
          </h2>

          <p className="text-[#C4BDAF] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Bring requests, updates, and residents together in one reliable workspace.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 font-medium text-sm bg-[#FAF8F5] hover:bg-[#EBE6DC] text-[#1F1E1C] transition-all border border-[#FAF8F5]"
            >
              Open the tracker
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>

            <Link
              to="/register"
              className="text-sm font-medium text-[#C4BDAF] hover:text-[#FAF8F5] underline underline-offset-4 transition-colors"
            >
              Create a resident account
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-[#EAE5DC] bg-[#F4F1EA] py-12 text-[#5C5955]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <a
              href="#home"
              onClick={(e) => handleScrollTo(e, 'home')}
              className="font-serif font-medium text-lg text-[#1F1E1C] hover:opacity-80 transition-opacity"
            >
              Society Maintenance Tracker
            </a>
            <p className="text-xs text-[#8F8778]">
              A clearer way to manage apartment society maintenance.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs font-medium text-[#5C5955]">
            <a
              href="#home"
              onClick={(e) => handleScrollTo(e, 'home')}
              className="hover:text-[#1F1E1C] transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => handleScrollTo(e, 'features')}
              className="hover:text-[#1F1E1C] transition-colors"
            >
              Features
            </a>
            <Link to="/login" className="hover:text-[#1F1E1C] transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-[#1F1E1C] transition-colors">
              Register
            </Link>
          </div>

          <p className="text-xs text-[#8F8778]">
            &copy; {new Date().getFullYear()} Society Maintenance Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
