import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  ArrowUpRight,
  Compass,
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1E1C] font-sans selection:bg-[#E2DDD2] selection:text-[#1F1E1C]">
      {/* 1. HEADER */}
      <header
        id="top"
        className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE5DC]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Wordmark */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 text-[#1F1E1C] hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#1F1E1C] flex items-center justify-center text-[#FAF8F5]">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-serif font-medium text-lg sm:text-xl tracking-tight">
              Society Maintenance Tracker
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#5C5955]">
            <a href="#top" className="hover:text-[#1F1E1C] transition-colors">
              Home
            </a>
            <a href="#how-it-works" className="hover:text-[#1F1E1C] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#1F1E1C] transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-[#1F1E1C] transition-colors">
              About
            </a>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-5">
            <Link
              to={authDestination}
              className="text-sm font-medium text-[#5C5955] hover:text-[#1F1E1C] transition-colors"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Sign in'}
            </Link>
            <Link
              to={isAuthenticated ? authDestination : '/register'}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1F1E1C] text-[#FAF8F5] hover:bg-[#383633] transition-all shadow-sm"
            >
              {isAuthenticated ? 'Open Portal' : 'Get started'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#1F1E1C] hover:bg-[#EAE5DC] transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-b border-[#EAE5DC] px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-3 text-base font-medium text-[#5C5955]">
              <a
                href="#top"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#1F1E1C]"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#1F1E1C]"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#1F1E1C]"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#1F1E1C]"
              >
                About
              </a>
            </nav>
            <div className="pt-4 border-t border-[#EAE5DC] flex flex-col space-y-3">
              <Link
                to={authDestination}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-[#1F1E1C] border border-[#DDD6C8] rounded-full"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Sign in'}
              </Link>
              <Link
                to={isAuthenticated ? authDestination : '/register'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#1F1E1C] text-[#FAF8F5] rounded-full shadow-sm"
              >
                {isAuthenticated ? 'Open Portal' : 'Get started'}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE5DC] text-[#6E7364] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>A better way to care for your community</span>
            </div>

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
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-sm bg-[#1F1E1C] hover:bg-[#383633] text-[#FAF8F5] shadow-sm transition-all"
              >
                Get started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center text-sm font-medium text-[#1F1E1C] hover:text-[#5C5955] transition-colors py-3 group"
              >
                Explore the platform
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: Architectural Hero Image Card */}
          <div className="lg:col-span-6 relative">
            <div className="bg-white p-3 sm:p-4 rounded-3xl border border-[#EAE5DC] shadow-xl shadow-stone-200/50 relative overflow-hidden group">
              <img
                src="/assets/hero_architecture.svg"
                alt="Contemporary residential architecture in a landscaped setting"
                className="w-full h-[320px] sm:h-[440px] object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.01]"
                loading="eager"
              />

              {/* Decorative Compass / Architectural Pin Control */}
              <div className="absolute top-7 right-7 w-11 h-11 rounded-full bg-[#1F1E1C]/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/20">
                <Compass className="w-5 h-5" />
              </div>

              {/* Subtle Floating Status Signal Card */}
              <div className="absolute bottom-6 left-6 bg-[#FAF8F5]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#EAE5DC] shadow-lg flex items-center space-x-3.5">
                <div className="w-8 h-8 rounded-full bg-[#EAE5DC] flex items-center justify-center text-[#6E7364]">
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
        <div className="bg-[#EBE6DC] border border-[#DDD6C8] rounded-3xl p-6 sm:p-10 shadow-lg shadow-stone-200/60">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Visual */}
            <div className="md:col-span-4 overflow-hidden rounded-2xl border border-[#D5CDBC] bg-white/50">
              <img
                src="/assets/maintenance_detail.svg"
                alt="Natural timber and architectural interior details"
                className="w-full h-44 sm:h-52 object-cover rounded-2xl"
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

            {/* Right Metric & Avatars */}
            <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end space-y-4 pt-4 md:pt-0 border-t md:border-t-0 border-[#D5CDBC]">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#EBE6DC] bg-[#1F1E1C] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center">
                  AD
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#EBE6DC] bg-[#6E7364] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center">
                  RE
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#EBE6DC] bg-[#8F8778] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center">
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
                className="text-xs font-bold text-[#1F1E1C] hover:text-[#6E7364] transition-colors inline-flex items-center gap-1 uppercase tracking-wider"
              >
                Learn more
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="bg-[#FAF8F5] p-8 sm:p-10 rounded-3xl border border-[#EAE5DC] hover:border-[#DDD6C8] transition-all shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#EAE5DC] flex items-center justify-center text-[#1F1E1C]">
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
          <div className="bg-[#EBE6DC]/60 p-8 sm:p-10 rounded-3xl border border-[#DDD6C8] hover:border-[#CCC3B2] transition-all shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1F1E1C]">
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
          <div className="bg-[#EBE6DC]/60 p-8 sm:p-10 rounded-3xl border border-[#DDD6C8] hover:border-[#CCC3B2] transition-all shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1F1E1C]">
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
          <div className="bg-[#FAF8F5] p-8 sm:p-10 rounded-3xl border border-[#EAE5DC] hover:border-[#DDD6C8] transition-all shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#EAE5DC] flex items-center justify-center text-[#1F1E1C]">
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

      {/* 5. THREE-STEP WORKFLOW SECTION */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[#F3EFE8] border-y border-[#EAE5DC]">
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

      {/* 6. ROLE PREVIEW SECTION */}
      <section id="about" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#EAE5DC] flex flex-col justify-between space-y-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-4">
                <span className="font-serif text-2xl text-[#1F1E1C] font-normal">Resident</span>
                <span className="text-xs font-semibold px-3 py-1 bg-[#F4F1EA] text-[#6E7364] rounded-full uppercase tracking-wider">
                  Community Member
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#5C5955]">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6E7364]" />
                  <span>Report complaints with optional photo uploads.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6E7364]" />
                  <span>Track personal requests and resolution history.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6E7364]" />
                  <span>Read official society notices and alerts.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6E7364]" />
                  <span>View resident dashboard with active ticket counts.</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F4F1EA] hover:bg-[#EAE5DC] text-[#1F1E1C] transition-all"
              >
                Resident experience
                <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Administrator Experience Card */}
          <div className="bg-[#EBE6DC] p-8 sm:p-10 rounded-3xl border border-[#DDD6C8] flex flex-col justify-between space-y-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#DDD6C8] pb-4">
                <span className="font-serif text-2xl text-[#1F1E1C] font-normal">Administrator</span>
                <span className="text-xs font-semibold px-3 py-1 bg-white/70 text-[#1F1E1C] rounded-full uppercase tracking-wider">
                  Management
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#5C5955]">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F1E1C]" />
                  <span>Review all complaints across the complex.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F1E1C]" />
                  <span>Change ticket status and prioritize urgent items.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F1E1C]" />
                  <span>Publish announcements with broadcast notifications.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F1E1C]" />
                  <span>View society-wide metrics and overdue SLA status.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F1E1C]" />
                  <span>Manage dynamic administrative threshold settings.</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1F1E1C] hover:bg-[#383633] text-[#FAF8F5] transition-all shadow-sm"
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
        <div className="bg-[#1F1E1C] text-[#FAF8F5] rounded-3xl p-10 sm:p-16 text-center space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight max-w-2xl mx-auto">
            Make everyday community management feel simpler.
          </h2>

          <p className="text-[#C4BDAF] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Bring requests, updates, and residents together in one reliable workspace.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-sm bg-[#FAF8F5] hover:bg-[#EBE6DC] text-[#1F1E1C] transition-all shadow-md"
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
            <span className="font-serif font-medium text-lg text-[#1F1E1C]">
              Society Maintenance Tracker
            </span>
            <p className="text-xs text-[#8F8778]">
              A clearer way to manage apartment society maintenance.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs font-medium text-[#5C5955]">
            <a href="#top" className="hover:text-[#1F1E1C] transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-[#1F1E1C] transition-colors">
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
