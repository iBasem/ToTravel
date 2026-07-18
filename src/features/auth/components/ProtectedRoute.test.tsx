import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Guard tests (audit test-coverage gap): auth gating previously had zero
// regression protection despite three waves of changes to it.

const mockAuth = vi.hoisted(() => ({
    state: {
        user: null as { id: string } | null,
        profile: null as { role: string } | null,
        loading: false,
        profileError: false,
        retryProfile: vi.fn(),
        signOut: vi.fn(),
    },
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
    useAuth: () => mockAuth.state,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
}));

function renderGuarded(requiredRole?: 'traveler' | 'agency' | 'admin') {
    return render(
        <MemoryRouter initialEntries={['/travel_agency/deals']}>
            <Routes>
                <Route
                    path="/travel_agency/*"
                    element={
                        <ProtectedRoute requiredRole={requiredRole}>
                            <div>PROTECTED CONTENT</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/auth" element={<div>AUTH PAGE</div>} />
                <Route path="/admin/login" element={<div>ADMIN LOGIN</div>} />
                <Route path="/admin" element={<div>ADMIN HOME</div>} />
                <Route path="/traveler/dashboard" element={<div>TRAVELER HOME</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    mockAuth.state.user = null;
    mockAuth.state.profile = null;
    mockAuth.state.loading = false;
    mockAuth.state.profileError = false;
    mockAuth.state.retryProfile = vi.fn();
    mockAuth.state.signOut = vi.fn();
});

describe('ProtectedRoute', () => {
    it('shows a spinner while auth is loading', () => {
        mockAuth.state.loading = true;
        renderGuarded('agency');
        expect(screen.queryByText('PROTECTED CONTENT')).toBeNull();
        expect(screen.queryByText('AUTH PAGE')).toBeNull();
    });

    it('redirects unauthenticated users to the agency auth page', () => {
        renderGuarded('agency');
        expect(screen.getByText('AUTH PAGE')).toBeTruthy();
    });

    it('redirects unauthenticated admins to the admin login', () => {
        renderGuarded('admin');
        expect(screen.getByText('ADMIN LOGIN')).toBeTruthy();
    });

    it('waits on a spinner while the profile row loads (no error)', () => {
        mockAuth.state.user = { id: 'u1' };
        renderGuarded('agency');
        expect(screen.queryByText('PROTECTED CONTENT')).toBeNull();
        expect(screen.queryByText('Retry')).toBeNull();
    });

    it('shows the retry screen instead of an infinite spinner on profile failure (AGY-12)', () => {
        mockAuth.state.user = { id: 'u1' };
        mockAuth.state.profileError = true;
        renderGuarded('agency');
        const retry = screen.getByText('Retry');
        fireEvent.click(retry);
        expect(mockAuth.state.retryProfile).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByText('Sign Out'));
        expect(mockAuth.state.signOut).toHaveBeenCalledTimes(1);
    });

    it('redirects a wrong-role user to their own home', () => {
        mockAuth.state.user = { id: 'u1' };
        mockAuth.state.profile = { role: 'traveler' };
        renderGuarded('agency');
        expect(screen.getByText('TRAVELER HOME')).toBeTruthy();
    });

    it('renders children for the matching role', () => {
        mockAuth.state.user = { id: 'u1' };
        mockAuth.state.profile = { role: 'agency' };
        renderGuarded('agency');
        expect(screen.getByText('PROTECTED CONTENT')).toBeTruthy();
    });
});
