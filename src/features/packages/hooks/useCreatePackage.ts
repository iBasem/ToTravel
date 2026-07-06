import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { PackageFormData } from '@/features/packages/types/wizard';
import { buildSavePackagePayload } from '@/features/packages/lib/savePackagePayload';

export function useCreatePackage() {
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Creates a package atomically via the save_package RPC. `submitForReview`
  // sets status='pending' (admin approval) vs 'draft'. The RPC is the single
  // source of truth for the multi-table write — no more per-table inserts.
  const createPackage = async (formData: PackageFormData, submitForReview = false) => {
    if (!user || !profile || profile.role !== 'agency') {
      toast.error('You must be logged in as a travel agency to create packages');
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('save_package', {
        p_package_id: null,
        p_data: buildSavePackagePayload(formData),
        p_submit_for_review: submitForReview,
      });

      if (error) throw error;

      toast.success(
        submitForReview
          ? 'Package submitted for review!'
          : 'Package saved as a draft!'
      );
      navigate('/travel_agency/packages');
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create package';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createPackage,
    loading
  };
}
