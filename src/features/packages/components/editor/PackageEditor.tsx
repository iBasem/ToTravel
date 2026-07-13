import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { WizardStepContent } from "@/features/packages/components/wizard/WizardStepContent";
import { SectionNav, getSections } from "@/features/packages/components/editor/SectionNav";
import { useSavePackage } from "@/features/packages/hooks/useSavePackage";
import { buildSavePackagePayload } from "@/features/packages/lib/savePackagePayload";
import { missingRequiredFields } from "@/features/packages/lib/wizardValidation";
import { createInitialPackageFormData } from "@/features/packages/lib/packageFormDefaults";
import type { PackageFormData } from "@/features/packages/types/wizard";
import { CheckCircle2, Loader2 } from "lucide-react";

const TOTAL_STEPS = 6;

interface PackageEditorProps {
  mode: 'create' | 'edit';
  packageId?: string | null;
  initialData?: PackageFormData;
  // Package status drives autosave: only drafts (and new packages) autosave.
  // Pending/published packages are live-facing, so edits apply on explicit
  // save only — never as half-typed autosaves.
  initialStatus?: string | null;
}

type AutosaveState = 'idle' | 'saving' | 'saved' | 'error';

export function PackageEditor({ mode, packageId: initialPackageId = null, initialData, initialStatus }: PackageEditorProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { savePackage, saving } = useSavePackage();

  const [formData, setFormData] = useState<PackageFormData>(
    () => initialData ?? createInitialPackageFormData()
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [packageId, setPackageId] = useState<string | null>(initialPackageId);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle');
  const [autosaving, setAutosaving] = useState(false);

  const autosaveEnabled = mode === 'create' || (initialStatus ?? 'draft') === 'draft';

  // Dirty = what would be saved differs from what is persisted (or from a
  // pristine form before the first save). Payload comparison ignores
  // transient UI fields.
  const payloadJson = JSON.stringify(buildSavePackagePayload(formData));
  const pristineJson = useMemo(
    () => JSON.stringify(buildSavePackagePayload(initialData ?? createInitialPackageFormData())),
    [initialData]
  );
  const lastSavedRef = useRef<string | null>(mode === 'edit' ? pristineJson : null);
  const isDirty = payloadJson !== (lastSavedRef.current ?? pristineJson);

  const sections = getSections(formData);
  const missingRequired = [...missingRequiredFields(1, formData), ...missingRequiredFields(4, formData)];
  const requiredComplete = missingRequired.length === 0;
  // Autosave starts once the basics are valid, so we never create junk drafts.
  const canAutosave = autosaveEnabled && missingRequiredFields(1, formData).length === 0;

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

  const handleFinish = async () => {
    const result = await savePackage({
      packageId,
      formData,
      submitForReview: !!formData.isPublished,
    });
    if (result.success) {
      navigate('/travel_agency/packages');
    }
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

  const finishLabel = mode === 'create'
    ? (saving ? t('packageWizard.creating') : t('packageWizard.createPackage'))
    : (saving ? t('common.saving', 'Saving...') : t('packageWizard.saveChanges', 'Save Changes'));

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
          {t('packageWizard.autosaveDisabledNote')}
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
            />
          </div>

          {missingRequired.length > 0 && (
            <p className="text-sm text-muted-foreground text-start" role="status">
              {t('packageWizard.missingRequired', {
                fields: missingRequired.map((key) => t(key)).join(i18n.language === 'ar' ? '، ' : ', ')
              })}
            </p>
          )}

          {/*
           * RTL navigation: Previous on the physical start side (back = start),
           * forward actions on the end side — matches the pre-editor wizard.
           */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              {t('common.previous')}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>

              {/* Save is reachable from every section — a price change must
                  not require walking to the last step. */}
              <Button
                onClick={handleFinish}
                disabled={saving || autosaving || !requiredComplete}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />}
                {currentStep === TOTAL_STEPS ? finishLabel : t('packageWizard.saveAndClose', 'Save & close')}
              </Button>

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
