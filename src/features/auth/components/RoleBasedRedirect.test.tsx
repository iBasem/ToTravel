import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleBasedRedirect } from './RoleBasedRedirect';

// Audit §4 named this one of the two priority tests (REG-13): the deep-link
// restoration rules had zero coverage through three waves of auth changes.

const mockAuth = vi.hoisted(() => ({
    state: {
        user: null as { id: string } | null,
        profile: null as { role: string } | null,
        loading: false,
    },
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
    useAuth: () => mockAuth.state,
}));

function renderAt(from?: string) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/redirect', state: from ? { from: { pathname: from } } : undefined }]}>
            <Routes>
                <Route path="/redirect" element={<RoleBasedRedirect />} />
                <Route path="/" element={<div>HOME</div>} />
                <Route path="/admin/*" element={<div>ADMIN AREA</div>} />
                <Route path="/travel_agency/*" element={<div>AGENCY AREA</div>} />
                <Route path="/traveler/dashboard" element={<div>TRAVELER AREA</div>} />
                <Route path="/packages/:id" element={<div>PUBLIC PACKAGE</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    mockAuth.state.user = { id: 'u1' };
    mockAuth.state.profile = { role: 'agency' };
    mockAuth.state.loading = false;
});

describe('RoleBasedRedirect', () => {
    it('does nothing while auth is loading', () => {
        mockAuth.state.loading = true;
        renderAt('/travel_agency/deals');
        expect(screen.queryByText('AGENCY AREA')).toBeNull();
    });

    it('restores an agency deep link inside /travel_agency', () => {
        renderAt('/travel_agency/deals');
        expect(screen.getByText('AGENCY AREA')).toBeTruthy();
    });

    it('allows agencies onto public /packages deep links', () => {
        renderAt('/packages/abc');
        expect(screen.getByText('PUBLIC PACKAGE')).toBeTruthy();
    });

    it('sends an agency to its home when the deep link belongs to another role', () => {
        renderAt('/admin/settings');
        expect(screen.getByText('AGENCY AREA')).toBeTruthy();
    });

    it('sends each role to its default home without a deep link', () => {
        renderAt();
        expect(screen.getByText('AGENCY AREA')).toBeTruthy();
    });

    it('routes travelers to the traveler dashboard', () => {
        mockAuth.state.profile = { role: 'traveler' };
        renderAt();
        expect(screen.getByText('TRAVELER AREA')).toBeTruthy();
    });

    it('routes admins to the admin area and honors admin deep links', () => {
        mockAuth.state.profile = { role: 'admin' };
        renderAt('/admin/deals');
        expect(screen.getByText('ADMIN AREA')).toBeTruthy();
    });
});
