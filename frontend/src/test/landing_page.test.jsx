import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';

describe('LandingPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  function renderLanding() {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    );
  }

  it('renders brand wordmark and major headline with no eyebrow badge', () => {
    renderLanding();

    // Eyebrow badge MUST be absent
    expect(
      screen.queryByText(/A better way to care for your community/i)
    ).not.toBeInTheDocument();

    // Brand Wordmark
    expect(screen.getAllByText(/Socivio/i).length).toBeGreaterThan(0);

    // Hero Headline
    expect(
      screen.getByRole('heading', { name: /A calmer way to care for your society\./i })
    ).toBeInTheDocument();

    // Supporting copy
    expect(
      screen.getByText(/Report maintenance requests, follow their progress/i)
    ).toBeInTheDocument();
  });

  it('renders realistic apartment photograph with proper alt text', () => {
    renderLanding();

    const heroImg = screen.getByAltText('Modern apartment society exterior with landscaped entrance');
    expect(heroImg).toBeInTheDocument();
    expect(heroImg).toHaveAttribute('src', '/assets/hero_apartment.jpg');
  });

  it('renders semantic section IDs for smooth in-page scrolling', () => {
    const { container } = renderLanding();

    expect(container.querySelector('#home')).toBeInTheDocument();
    expect(container.querySelector('#how-it-works')).toBeInTheDocument();
    expect(container.querySelector('#features')).toBeInTheDocument();
    expect(container.querySelector('#about')).toBeInTheDocument();
  });

  it('clicking Home or wordmark smoothly scrolls to top without reload', () => {
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    renderLanding();

    const homeLinks = screen.getAllByText('Home');
    expect(homeLinks.length).toBeGreaterThan(0);

    fireEvent.click(homeLinks[0]);
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0 })
    );
  });

  it('renders navigation links and action buttons', () => {
    renderLanding();

    // Navigation links
    expect(screen.getAllByText('How It Works').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Features').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);

    // Action buttons
    const signInLinks = screen.getAllByRole('link', { name: /Sign in/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signInLinks[0]).toHaveAttribute('href', '/signin');

    const getStartedLinks = screen.getAllByRole('link', { name: /Get started/i });
    expect(getStartedLinks.length).toBeGreaterThan(0);
    expect(getStartedLinks[0]).toHaveAttribute('href', '/signup');
  });

  it('renders the 4 features and 3-step workflow items', () => {
    renderLanding();

    // Features Section Heading & Items
    expect(
      screen.getByText(/Everything your community needs to stay in sync\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Report without the back-and-forth/i)).toBeInTheDocument();
    expect(screen.getByText(/Know what is happening/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep everyone informed/i)).toBeInTheDocument();
    expect(screen.getByText(/Give administrators clarity/i)).toBeInTheDocument();

    // 3-Step Process
    expect(screen.getByText(/From request to resolution\./i)).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Track')).toBeInTheDocument();
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('renders role preview and final call to action', () => {
    renderLanding();

    // Role preview section
    expect(
      screen.getByText(/Designed for every member of the society\./i)
    ).toBeInTheDocument();
    expect(screen.getByText('Resident experience')).toBeInTheDocument();
    expect(screen.getByText('Admin experience')).toBeInTheDocument();

    // Final CTA section
    expect(
      screen.getByText(/Make everyday community management feel simpler\./i)
    ).toBeInTheDocument();
    const ctaLink = screen.getByRole('link', { name: /Open the tracker/i });
    expect(ctaLink).toHaveAttribute('href', '/signin');
  });
});
