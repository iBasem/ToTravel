import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useBookings } from './useBookings';

// Audit §4's second named priority test (REG-13): the booking status mutation
// (transition payload shape + cache invalidation) had no coverage.

const mocks = vi.hoisted(() => ({
    updatePatches: [] as Array<Record<string, unknown>>,
    updateError: null as { message: string } | null,
    audit: vi.fn(),
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'agency-1' }, profile: { role: 'agency' } }),
}));

vi.mock('@/features/agency/lib/audit', () => ({
    logAgencyAction: (...args: unknown[]) => mocks.audit(...args),
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            // list query chain: select().order().limit().eq() -> awaitable
            select: () => {
                const builder = {
                    order: () => builder,
                    limit: () => builder,
                    eq: () => builder,
                    then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
                        resolve({ data: [], error: null }),
                };
                return builder;
            },
            update: (patch: Record<string, unknown>) => ({
                eq: async () => {
                    mocks.updatePatches.push(patch);
                    return { error: mocks.updateError };
                },
            }),
        }),
    },
}));

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
    mocks.updatePatches.length = 0;
    mocks.updateError = null;
    mocks.audit.mockClear();
});

describe('useBookings.updateBookingStatus', () => {
    it('sends status only for a plain confirm and reports success', async () => {
        const { result } = renderHook(() => useBookings(), { wrapper });
        const res = await result.current.updateBookingStatus('b1', 'confirmed');
        expect(res.success).toBe(true);
        expect(mocks.updatePatches[0]).toMatchObject({ status: 'confirmed' });
        expect(mocks.updatePatches[0]).not.toHaveProperty('cancellation_reason');
        await waitFor(() => expect(mocks.audit).toHaveBeenCalledTimes(1));
        expect(mocks.audit.mock.calls[0][1]).toMatchObject({ actionType: 'booking_confirmed' });
    });

    it('persists a trimmed cancellation reason only when cancelling', async () => {
        const { result } = renderHook(() => useBookings(), { wrapper });
        await result.current.updateBookingStatus('b1', 'cancelled', { cancellationReason: '  overbooked  ' });
        expect(mocks.updatePatches[0]).toMatchObject({ status: 'cancelled', cancellation_reason: 'overbooked' });

        await result.current.updateBookingStatus('b2', 'confirmed', { cancellationReason: 'ignored' });
        expect(mocks.updatePatches[1]).not.toHaveProperty('cancellation_reason');
    });

    it('returns the failure without auditing when the update errors', async () => {
        mocks.updateError = { message: 'Invalid booking status transition: pending -> completed' };
        const { result } = renderHook(() => useBookings(), { wrapper });
        const res = await result.current.updateBookingStatus('b1', 'completed');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Invalid booking status transition');
        expect(mocks.audit).not.toHaveBeenCalled();
    });
});
