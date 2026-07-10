import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAdminAction } from './audit';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return { supabase: { from: vi.fn(() => ({ insert })) } };
});

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

type MockedFrom = ReturnType<typeof vi.fn> & { mock: { results: { value: { insert: ReturnType<typeof vi.fn> } }[] } };

describe('logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a complete admin_activity_logs row', async () => {
    await logAdminAction(
      { id: 'admin-1', name: 'Basem Admin' },
      {
        actionType: 'agency_approval',
        description: 'Approved agency "Desert Tours"',
        entityType: 'agency',
        entityId: 'agency-9',
        metadata: { status: 'active' },
      },
    );

    expect(supabase.from).toHaveBeenCalledWith('admin_activity_logs');
    const insert = (supabase.from as unknown as MockedFrom).mock.results[0].value.insert;
    expect(insert).toHaveBeenCalledWith({
      user_id: 'admin-1',
      user_name: 'Basem Admin',
      action_type: 'agency_approval',
      action_description: 'Approved agency "Desert Tours"',
      entity_type: 'agency',
      entity_id: 'agency-9',
      metadata: { status: 'active' },
    });
  });

  it('defaults optional fields to null/empty', async () => {
    await logAdminAction({ id: undefined, name: 'Admin' }, { actionType: 'settings_update', description: 'Updated settings' });
    const insert = (supabase.from as unknown as MockedFrom).mock.results[0].value.insert;
    expect(insert).toHaveBeenCalledWith({
      user_id: null,
      user_name: 'Admin',
      action_type: 'settings_update',
      action_description: 'Updated settings',
      entity_type: null,
      entity_id: null,
      metadata: {},
    });
  });

  it('never throws when the insert fails — the action already happened', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const insert = vi.fn().mockResolvedValue({ error: { message: 'RLS denied' } });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ insert });

    await expect(
      logAdminAction({ id: 'x', name: 'Admin' }, { actionType: 'refund', description: 'Refunded' }),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
