import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AgencyStatusGuard } from './AgencyStatusGuard';

const mockState = vi.hoisted(() => ({
    status: 'active' as string | null,
    fail: false,
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'agency-1' }, signOut: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => {
                        if (mockState.fail) return { data: null, error: new Error('boom') };
                        return { data: mockState.status === null ? null : { status: mockState.status }, error: null };
                    },
                }),
            }),
        }),
    },
}));

beforeEach(() => {
    mockState.status = 'active';
    mockState.fail = false;
});

describe('AgencyStatusGuard (AGY-4)', () => {
    it('renders children for an active agency', async () => {
        render(<AgencyStatusGuard><div>PORTAL</div></AgencyStatusGuard>);
        await waitFor(() => expect(screen.getByText('PORTAL')).toBeTruthy());
    });

    it('blocks a suspended agency with the interstitial', async () => {
        mockState.status = 'suspended';
        render(<AgencyStatusGuard><div>PORTAL</div></AgencyStatusGuard>);
        await waitFor(() => expect(screen.getByText('Your agency account is suspended')).toBeTruthy());
        expect(screen.queryByText('PORTAL')).toBeNull();
    });

    it('blocks a pending agency with the under-review interstitial', async () => {
        mockState.status = 'pending';
        render(<AgencyStatusGuard><div>PORTAL</div></AgencyStatusGuard>);
        await waitFor(() => expect(screen.getByText('Your agency is under review')).toBeTruthy());
    });

    it('fails OPEN when the status fetch keeps erroring', async () => {
        mockState.fail = true;
        render(<AgencyStatusGuard><div>PORTAL</div></AgencyStatusGuard>);
        await waitFor(() => expect(screen.getByText('PORTAL')).toBeTruthy());
    });
});
