
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BasePricing } from "./pricing/BasePricing";
import { InclusionsManager } from "./pricing/InclusionsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Plus, X } from "lucide-react";

import type { PackageFormData } from "@/features/packages/types/wizard";

interface PricingStepProps {
  data: PackageFormData['pricing'];
  onUpdate: (data: PackageFormData['pricing']) => void;
}

export function PricingStep({ data, onUpdate }: PricingStepProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState(() => {
    const defaultInclusions = {
      accommodation: { included: false, details: [] },
      meals: { included: false, details: [] },
      transportation: { included: false, details: [] },
      activities: { included: false, details: [] },
      guides: { included: false, details: [] },
      insurance: { included: false, details: [] },
      other: { included: false, details: [] }
    };

    return {
      currency: data?.currency || "USD",
      basePrice: data?.basePrice || "",
      originalPrice: data?.originalPrice || "",
      discount: data?.discount || "",
      inclusions: data?.inclusions ? { ...defaultInclusions, ...data.inclusions } : defaultInclusions,
      additionalInclusions: data?.additionalInclusions || [],
      exclusions: data?.exclusions || [],
      inclusions_ar: data?.inclusions_ar || [],
      exclusions_ar: data?.exclusions_ar || [],
      newInclusion: "",
      newExclusion: "",
      newInclusionAr: "",
      newExclusionAr: "",
      cancellation_policy: data?.cancellation_policy || '',
      terms_conditions: data?.terms_conditions || ''
    };
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleInputChange = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInclusionToggle = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      inclusions: {
        ...prev.inclusions,
        [category]: {
          ...prev.inclusions[category],
          included: checked
        }
      }
    }));
  };

  const addInclusionDetail = (category: string, detail: string) => {
    if (detail.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: {
          ...prev.inclusions,
          [category]: {
            ...prev.inclusions[category],
            details: [...prev.inclusions[category].details, detail.trim()]
          }
        }
      }));
    }
  };

  const removeInclusionDetail = (category: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: {
        ...prev.inclusions,
        [category]: {
          ...prev.inclusions[category],
          details: prev.inclusions[category].details.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const addAdditionalInclusion = () => {
    if (formData.newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalInclusions: [...prev.additionalInclusions, prev.newInclusion.trim()],
        newInclusion: ""
      }));
    }
  };

  const addExclusion = () => {
    if (formData.newExclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        exclusions: [...prev.exclusions, prev.newExclusion.trim()],
        newExclusion: ""
      }));
    }
  };

  const removeAdditionalInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalInclusions: prev.additionalInclusions.filter((_, i) => i !== index)
    }));
  };

  const removeExclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index)
    }));
  };

  const addInclusionAr = () => {
    if (formData.newInclusionAr.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions_ar: [...prev.inclusions_ar, prev.newInclusionAr.trim()],
        newInclusionAr: ""
      }));
    }
  };

  const removeInclusionAr = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions_ar: prev.inclusions_ar.filter((_, i) => i !== index)
    }));
  };

  const addExclusionAr = () => {
    if (formData.newExclusionAr.trim()) {
      setFormData(prev => ({
        ...prev,
        exclusions_ar: [...prev.exclusions_ar, prev.newExclusionAr.trim()],
        newExclusionAr: ""
      }));
    }
  };

  const removeExclusionAr = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exclusions_ar: prev.exclusions_ar.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <BasePricing
        data={formData}
        onUpdate={handleInputChange}
      />

      <InclusionsManager
        inclusions={formData.inclusions}
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
              value={formData.newInclusion}
              onChange={(e) => handleInputChange("newInclusion", e.target.value)}
              placeholder={t('packageWizard.additionalInclusionPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && addAdditionalInclusion()}
            />
            <Button type="button" onClick={addAdditionalInclusion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.additionalInclusions.map((inclusion: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {inclusion}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeAdditionalInclusion(index)}
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
              value={formData.newExclusion}
              onChange={(e) => handleInputChange("newExclusion", e.target.value)}
              placeholder={t('packageWizard.exclusionPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && addExclusion()}
            />
            <Button type="button" onClick={addExclusion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.exclusions.map((exclusion: string, index: number) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {exclusion}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeExclusion(index)}
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
                value={formData.newInclusionAr}
                onChange={(e) => handleInputChange("newInclusionAr", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addInclusionAr()}
              />
              <Button type="button" onClick={addInclusionAr} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.inclusions_ar.map((inclusion: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {inclusion}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeInclusionAr(index)}
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
                value={formData.newExclusionAr}
                onChange={(e) => handleInputChange("newExclusionAr", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addExclusionAr()}
              />
              <Button type="button" onClick={addExclusionAr} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.exclusions_ar.map((exclusion: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {exclusion}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeExclusionAr(index)}
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
            <Input
              value={formData.cancellation_policy}
              onChange={(e) => handleInputChange("cancellation_policy", e.target.value)}
              placeholder={t('packageWizard.cancellationPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-start block">{t('packageWizard.termsAndConditions')}</Label>
            <Input
              value={formData.terms_conditions}
              onChange={(e) => handleInputChange("terms_conditions", e.target.value)}
              placeholder={t('packageWizard.termsPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
