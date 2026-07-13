import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/ui/button";
import { WizardStepContent } from "@/features/packages/components/wizard/WizardStepContent";
import { SectionNav, getSections } from "@/features/packages/components/editor/SectionNav";
import { useSavePackage } from "@/features/packages/hooks/useSavePackage";
import { useDepartures } from "@/features/packages/hooks/useDepartures";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { buildSavePackagePayload } from "@/features/packages/lib/savePackagePayload";
import { missingRequiredFields, missingForSubmit } from "@/features/packages/lib/wizardValidation";
import { createInitialPackageFormData } from "@/features/packages/lib/packageFormDefaults";
import type { PackageFormData } from "@/features/packages/types/wizard";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const TOTAL_STEPS = 5;

interface PackageEditorProps {
  mode: 'create' | 'edit';
  packageId?: string | null;
  initialData?: PackageFormData;
  // Package status drives autosave and the save semantics: drafts autosave;
  // published packages save explicitly and go back to review (owner policy).
  initialStatus?: string | null;
}

type AutosaveState = 'idle' | 'saving' | 'saved' | 'error';

export function PackageEditor({ mode, packageId: initialPackageId = null, initialData, initialStatus }: PackageEditorProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savePackage, saving } = useSavePackage();

  const [formData, setFormData] = useState<PackageFormData>(
    () => initialData ?? createInitialPackageFormData()
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [packageId, setPackageId] = useState<string | null>(initialPackageId);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle');
  const [autosaving, setAutosaving] = useState(false);

  const status = initialStatus ?? 'draft';
  const autosaveEnabled = mode === 'create' || status === 'draft';
  const isPublished = mode === 'edit' && status === 'published';

  // Departure dates (tour start dates) live outside the form; they gate submit.
  const { departures, refetch: refetchDepartures } = useDepartures(packageId ?? undefined);
  const today = new Date().toISOString().slice(0, 10);
  const departuresOk = departures.some(
    (d) => d.status === 'scheduled' && d.departure_date >= today
  );

  // Dirty = what would be saved differs from what is persisted. Duplicated
  // packages (create mode with initialData) compare against an EMPTY form so
  // they read as dirty and autosave persists the copy immediately.
  const payloadJson = JSON.stringify(buildSavePackagePayload(formData));
  const pristineJson = useMemo(
    () => JSON.stringify(buildSavePackagePayload(
      mode === 'edit' ? (initialData ?? createInitialPackageFormData()) : createInitialPackageFormData()
    )),
    [initialData, mode]
  );
  const lastSavedRef = useRef<string | null>(mode === 'edit' ? pristineJson : null);
  const isDirty = payloadJson !== (lastSavedRef.current ?? pristineJson);

  const sections = getSections(formData, departuresOk);
  const missingSubmit = missingForSubmit(formData);
  const submitReady = missingSubmit.length === 0 && departuresOk;
  // Autosave starts once the basics are valid, so we never create junk drafts.
  const canAutosave = autosaveEnabled && missingRequiredFields(1, formData).length === 0;

  // Owner-approved extra: prefill policies from the agency's saved defaults
  // on a brand-new (non-duplicate) package.
  useEffect(() => {
    if (mode !== 'create' || initialData || !user?.id) return;
    supabase
      .from('travel_agencies')
      .select('default_cancellation_policy, default_terms_conditions')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setFormData(prev => {
          if (prev.pricing.cancellation_policy || prev.pricing.terms_conditions) return prev;
          if (!data.default_cancellation_policy && !data.default_terms_conditions) return prev;
          return {
            ...prev,
            pricing: {
              ...prev.pricing,
              cancellation_policy: data.default_cancellation_policy || '',
              terms_conditions: data.default_terms_conditions || '',
            },
          };
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.id]);

  useEffect(() => {
    if (!canAutosave || !isDirty || autosaving || saving) return;
    const timer = setTimeout(async () => {
      setAutosaving(true);
      setAutosaveState('saving');
      const snapshot = payloadJson;
      const result = await savePackage({ packageId, formData, silent: true });
      if (result.success) {
        if (!packageId) setPackageId(result.id);
        lastSavedRef.current = snapshot;
        setAutosaveState('saved');
      } else {
        setAutosaveState('error');
      }
      setAutosaving(false);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadJson, canAutosave, isDirty, autosaving, saving, packageId]);

  const updateFormData = <K extends keyof PackageFormData>(stepKey: K, data: PackageFormData[K]) => {
    // Bail out on identical references so re-pushed unchanged state is a no-op.
    setFormData(prev => (prev[stepKey] === data ? prev : { ...prev, [stepKey]: data }));
  };

  const handleFormDataUpdate = (data: PackageFormData) => {
    setFormData(data);
  };

  const handleSave = async (submitForReview: boolean) => {
    const result = await savePackage({ packageId, formData, submitForReview, silent: true });
    if (!result.success) {
      toast.error('error' in result ? result.error : t('errors.somethingWentWrong', 'Something went wrong'));
      return;
    }
    if (submitForReview) {
      toast.success(t('agencyDashboard.submittedForReview', 'Submitted for review'));
    } else if (isPublished) {
      // Owner policy: content edits to a live package go back to review.
      toast.success(t('packageWizard.sentBackForReview', 'Changes saved — the package was sent back for admin re-approval'));
    } else {
      toast.success(t('packageWizard.savedAsDraftSuccess', 'Package saved as draft successfully!'));
    }
    navigate('/travel_agency/packages');
  };

  const handleClose = () => {
    if (isDirty && !window.confirm(t('packageWizard.unsavedChangesConfirm'))) {
      return;
    }
    navigate('/travel_agency/packages');
  };

  const autosaveStatus = () => {
    if (autosaveState === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          {t('common.saving', 'Saving...')}
        </span>
      );
    }
    if (autosaveState === 'error') {
      return <span className="text-destructive">{t('packageWizard.autosaveError')}</span>;
    }
    if (!isDirty && lastSavedRef.current !== null && (autosaveState === 'saved' || mode === 'edit')) {
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" aria-hidden />
          {t('packageWizard.draftSaved')}
        </span>
      );
    }
    if (isDirty) {
      return <span className="text-muted-foreground">{t('packageWizard.unsavedChanges')}</span>;
    }
    return null;
  };

  // Everything still blocking submit, for the checklist hint (form fields +
  // the departures gate, which lives outside the form).
  const submitBlockers = [
    ...missingSubmit.map((key) => t(key)),
    ...(!departuresOk ? [t('packageWizard.departuresRequired', 'at least one upcoming departure')] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === 'create'
            ? t('packageWizard.createNewPackage')
            : t('packageWizard.editPackage', 'Edit Package')}
        </h1>
        <div className="text-sm" role="status">
          {autosaveStatus()}
        </div>
      </div>

      {!autosaveEnabled && (
        <p className="text-sm text-muted-foreground text-start">
          {isPublished
            ? t('packageWizard.publishedEditNote', 'This package is live. Saving content changes sends it back for admin re-approval; departure and seat changes apply immediately.')
            : t('packageWizard.autosaveDisabledNote')}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
        <div className="lg:sticky lg:top-4">
          <SectionNav
            sections={sections}
            currentStep={currentStep}
            onSelect={setCurrentStep}
          />
        </div>

        <div className="space-y-4 min-w-0">
          <div className="bg-card rounded-lg shadow p-6">
            <WizardStepContent
              currentStep={currentStep}
              formData={formData}
              onUpdate={updateFormData}
              onFormDataUpdate={handleFormDataUpdate}
              packageId={packageId}
              onDeparturesChanged={refetchDepartures}
            />
          </div>

          {submitBlockers.length > 0 && (
            <p className="text-sm text-muted-foreground text-start" role="status">
              {t('packageWizard.missingRequired', {
                fields: submitBlockers.join(i18n.language === 'ar' ? '، ' : ', ')
              })}
            </p>
          )}

          {/*
           * RTL navigation: Previous on the physical start side (back = start),
           * forward actions on the end side — matches the pre-editor wizard.
           */}
          <div className="flex flex-wrap justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              {t('common.previous')}
            </Button>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>

              {/* Explicit save is reachable from every section. */}
              <Button
                variant={autosaveEnabled ? "outline" : "default"}
                onClick={() => handleSave(false)}
                disabled={saving || autosaving || missingRequiredFields(1, formData).length > 0}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />}
                {autosaveEnabled
                  ? t('packageWizard.saveDraftAndClose', 'Save draft & close')
                  : t('packageWizard.saveChanges', 'Save Changes')}
              </Button>

              {/* Submitting only makes sense for drafts; pending is already
                  in review and published edits resubmit via Save. */}
              {autosaveEnabled && (
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving || autosaving || !submitReady}
                >
                  <Send className="w-4 h-4 me-2" aria-hidden />
                  {t('packageWizard.submitForReview', 'Submit for review')}
                </Button>
              )}

              {currentStep < TOTAL_STEPS && (
                <Button variant="outline" onClick={() => setCurrentStep(s => Math.min(TOTAL_STEPS, s + 1))}>
                  {t('common.next')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
