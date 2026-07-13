
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BasePricing } from "./pricing/BasePricing";
import { InclusionsManager } from "./pricing/InclusionsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Plus, X } from "lucide-react";

import type { PackageFormData } from "@/features/packages/types/wizard";

interface PricingStepProps {
  data: PackageFormData['pricing'];
  onUpdate: (data: PackageFormData['pricing']) => void;
}

// Controlled section: pricing lives in the shared form state; only the
// pending add-item inputs are local UI state.
export function PricingStep({ data, onUpdate }: PricingStepProps) {
  const { t } = useTranslation();

  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newInclusionAr, setNewInclusionAr] = useState("");
  const [newExclusionAr, setNewExclusionAr] = useState("");

  const additionalInclusions = data.additionalInclusions || [];
  const exclusions = data.exclusions || [];
  const inclusionsAr = data.inclusions_ar || [];
  const exclusionsAr = data.exclusions_ar || [];

  const setField = <K extends keyof PackageFormData['pricing']>(field: K, value: PackageFormData['pricing'][K]) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleInclusionToggle = (category: string, checked: boolean) => {
    const key = category as keyof PackageFormData['pricing']['inclusions'];
    setField("inclusions", {
      ...data.inclusions,
      [key]: { ...data.inclusions[key], included: checked }
    });
  };

  const addInclusionDetail = (category: string, detail: string) => {
    if (!detail.trim()) return;
    const key = category as keyof PackageFormData['pricing']['inclusions'];
    setField("inclusions", {
      ...data.inclusions,
      [key]: { ...data.inclusions[key], details: [...data.inclusions[key].details, detail.trim()] }
    });
  };

  const removeInclusionDetail = (category: string, index: number) => {
    const key = category as keyof PackageFormData['pricing']['inclusions'];
    setField("inclusions", {
      ...data.inclusions,
      [key]: { ...data.inclusions[key], details: data.inclusions[key].details.filter((_, i) => i !== index) }
    });
  };

  const addAdditionalInclusion = () => {
    if (!newInclusion.trim()) return;
    setField("additionalInclusions", [...additionalInclusions, newInclusion.trim()]);
    setNewInclusion("");
  };

  const addExclusion = () => {
    if (!newExclusion.trim()) return;
    setField("exclusions", [...exclusions, newExclusion.trim()]);
    setNewExclusion("");
  };

  const addInclusionAr = () => {
    if (!newInclusionAr.trim()) return;
    setField("inclusions_ar", [...inclusionsAr, newInclusionAr.trim()]);
    setNewInclusionAr("");
  };

  const addExclusionAr = () => {
    if (!newExclusionAr.trim()) return;
    setField("exclusions_ar", [...exclusionsAr, newExclusionAr.trim()]);
    setNewExclusionAr("");
  };

  return (
    <div className="space-y-6">
      <BasePricing
        data={{ basePrice: data.basePrice }}
        onUpdate={(field, value) => setField(field as 'basePrice', value)}
      />

      <InclusionsManager
        inclusions={data.inclusions}
        onToggle={handleInclusionToggle}
        onAddDetail={addInclusionDetail}
        onRemoveDetail={removeInclusionDetail}
      />

      {/* Additional Inclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.additionalInclusions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              placeholder={t('packageWizard.additionalInclusionPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && addAdditionalInclusion()}
            />
            <Button type="button" onClick={addAdditionalInclusion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {additionalInclusions.map((inclusion: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {inclusion}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setField("additionalInclusions", additionalInclusions.filter((_, i) => i !== index))}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.whatsNotIncluded')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder={t('packageWizard.exclusionPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && addExclusion()}
            />
            <Button type="button" onClick={addExclusion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exclusions.map((exclusion: string, index: number) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {exclusion}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setField("exclusions", exclusions.filter((_, i) => i !== index))}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Arabic Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.arabicContent', 'Arabic content (optional)')}</CardTitle>
          <p className="text-sm text-muted-foreground text-start">
            {t('packageWizard.arabicContentHint', 'Shown to Arabic-speaking travelers; English is used when empty')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-start block">{t('packageWizard.inclusionsAr', "What's included (Arabic)")}</Label>
            <div className="flex gap-2">
              <Input
                dir="rtl"
                value={newInclusionAr}
                onChange={(e) => setNewInclusionAr(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addInclusionAr()}
              />
              <Button type="button" onClick={addInclusionAr} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {inclusionsAr.map((inclusion: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {inclusion}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setField("inclusions_ar", inclusionsAr.filter((_, i) => i !== index))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-start block">{t('packageWizard.exclusionsAr', "What's not included (Arabic)")}</Label>
            <div className="flex gap-2">
              <Input
                dir="rtl"
                value={newExclusionAr}
                onChange={(e) => setNewExclusionAr(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addExclusionAr()}
              />
              <Button type="button" onClick={addExclusionAr} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {exclusionsAr.map((exclusion: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {exclusion}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setField("exclusions_ar", exclusionsAr.filter((_, i) => i !== index))}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.policiesAndTerms')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-start block">{t('packageWizard.cancellationPolicy')}</Label>
            <Textarea
              value={data.cancellation_policy}
              onChange={(e) => setField("cancellation_policy", e.target.value)}
              placeholder={t('packageWizard.cancellationPlaceholder')}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-start block">{t('packageWizard.termsAndConditions')}</Label>
            <Textarea
              value={data.terms_conditions}
              onChange={(e) => setField("terms_conditions", e.target.value)}
              placeholder={t('packageWizard.termsPlaceholder')}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
