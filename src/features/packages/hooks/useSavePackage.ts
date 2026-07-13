import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { PackageFormData } from '@/features/packages/types/wizard';
import { buildSavePackagePayload } from '@/features/packages/lib/savePackagePayload';

interface SavePackageArgs {
  packageId: string | null;
  formData: PackageFormData;
  submitForReview?: boolean;
  // Autosave passes silent: no toasts; callers surface state themselves.
  silent?: boolean;
}

type SaveResult =
  | { success: true; id: string }
  | { success: false; error: string };

// Single save path for create, edit, and autosave — all through the atomic
// save_package RPC (null packageId creates a draft, an id upserts in place).
// Does not navigate; callers decide what happens after a save.
export function useSavePackage() {
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const savePackage = async ({
    packageId,
    formData,
    submitForReview = false,
    silent = false,
  }: SavePackageArgs): Promise<SaveResult> => {
    if (!user || !profile || profile.role !== 'agency') {
      const error = t('auth.agencyRequired', 'You must be logged in as a travel agency to save packages');
      if (!silent) toast.error(error);
      return { success: false, error };
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('save_package', {
        p_package_id: packageId,
        p_data: buildSavePackagePayload(formData),
        p_submit_for_review: submitForReview,
      });

      if (error) throw error;

      if (!silent) {
        toast.success(
          submitForReview
            ? t('agencyDashboard.submittedForReview', 'Submitted for review')
            : t('packageWizard.savedAsDraftSuccess', 'Package saved as draft successfully!')
        );
      }
      return { success: true, id: data as string };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save package';
      if (!silent) toast.error(message);
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  };

  return { savePackage, saving };
}
