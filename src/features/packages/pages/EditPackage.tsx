import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PackageEditor } from "@/features/packages/components/editor/PackageEditor";
import { loadPackageFormData } from "@/features/packages/lib/loadPackageFormData";
import type { PackageFormData } from "@/features/packages/types/wizard";

// Loads the package graph and hands it to the shared editor. The editor owns
// all state, saving, and autosave; this page is only the fetch + guard shell.
export default function EditPackage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<PackageFormData | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;
    setLoading(true);
    loadPackageFormData(id, user.id)
      .then(({ formData, status }) => {
        if (cancelled) return;
        setInitialData(formData);
        setStatus(status);
      })
      .catch((error) => {
        console.error('Error loading package:', error);
        if (cancelled) return;
        toast.error(t('agencyDashboard.errorLoadingPackages', 'Failed to load package'));
        navigate('/travel_agency/packages');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, user?.id, navigate, t]);

  if (loading || !initialData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <PackageEditor
      mode="edit"
      packageId={id ?? null}
      initialData={initialData}
      initialStatus={status}
    />
  );
}
