import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PackageEditor } from "@/features/packages/components/editor/PackageEditor";
import { loadPackageFormData, asDuplicate } from "@/features/packages/lib/loadPackageFormData";
import type { PackageFormData } from "@/features/packages/types/wizard";

// Creation goes straight into the full-page editor; autosave creates the
// draft once the basics are valid. With ?duplicate=<id>, the editor opens
// pre-filled from an existing package as a new draft (departures not copied).
export default function CreatePackage() {
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(!!duplicateId);
  const [initialData, setInitialData] = useState<PackageFormData | undefined>(undefined);

  useEffect(() => {
    if (!duplicateId || !user?.id) return;
    let cancelled = false;
    setLoading(true);
    loadPackageFormData(duplicateId, user.id)
      .then(({ formData }) => {
        if (!cancelled) setInitialData(asDuplicate(formData));
      })
      .catch((error) => {
        console.error('Error loading package to duplicate:', error);
        if (!cancelled) toast.error(t('agencyDashboard.errorLoadingPackages', 'Failed to load package'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [duplicateId, user?.id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return <PackageEditor mode="create" initialData={initialData} />;
}
