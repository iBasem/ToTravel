
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BasePricing } from "./pricing/BasePricing";
import { InclusionsManager } from "./pricing/InclusionsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface PricingStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function PricingStep({ data, onUpdate }: PricingStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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
      newInclusion: "",
      newExclusion: "",
      cancellation_policy: data?.cancellation_policy || '',
      terms_conditions: data?.terms_conditions || ''
    };
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleInputChange = (field: string, value: any) => {
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

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
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
          <CardTitle className={isRTL ? 'text-right' : 'text-left'}>{t('packageWizard.additionalInclusions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Input
              value={formData.newInclusion}
              onChange={(e) => handleInputChange("newInclusion", e.target.value)}
              placeholder={t('packageWizard.additionalInclusionPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && addAdditionalInclusion()}
              className={isRTL ? 'text-right' : 'text-left'}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <Button type="button" onClick={addAdditionalInclusion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {formData.additionalInclusions.map((inclusion: string, index: number) => (
              <Badge key={index} variant="secondary" className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          <CardTitle className={isRTL ? 'text-right' : 'text-left'}>{t('packageWizard.whatsNotIncluded')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Input
              value={formData.newExclusion}
              onChange={(e) => handleInputChange("newExclusion", e.target.value)}
              placeholder={t('packageWizard.exclusionPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && addExclusion()}
              className={isRTL ? 'text-right' : 'text-left'}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <Button type="button" onClick={addExclusion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {formData.exclusions.map((exclusion: string, index: number) => (
              <Badge key={index} variant="outline" className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
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

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className={isRTL ? 'text-right' : 'text-left'}>{t('packageWizard.policiesAndTerms')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('packageWizard.cancellationPolicy')}</Label>
            <Input
              value={formData.cancellation_policy}
              onChange={(e) => handleInputChange("cancellation_policy", e.target.value)}
              placeholder={t('packageWizard.cancellationPlaceholder')}
              className={isRTL ? 'text-right' : 'text-left'}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('packageWizard.termsAndConditions')}</Label>
            <Input
              value={formData.terms_conditions}
              onChange={(e) => handleInputChange("terms_conditions", e.target.value)}
              placeholder={t('packageWizard.termsPlaceholder')}
              className={isRTL ? 'text-right' : 'text-left'}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
