
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
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Plus, X, Plane, BookmarkPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";

import type { PackageFormData, FlightOption } from "@/features/packages/types/wizard";

interface PricingStepProps {
  data: PackageFormData['pricing'];
  onUpdate: (data: PackageFormData['pricing']) => void;
}

// Controlled section: pricing lives in the shared form state; only the
// pending add-item inputs are local UI state.
export function PricingStep({ data, onUpdate }: PricingStepProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newInclusionAr, setNewInclusionAr] = useState("");
  const [newExclusionAr, setNewExclusionAr] = useState("");
  const [savingDefaults, setSavingDefaults] = useState(false);

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

  // Owner-approved extra: write the current policies to the agency profile
  // as defaults; the editor prefills them into every new package.
  const saveAsAgencyDefaults = async () => {
    if (!user) return;
    setSavingDefaults(true);
    const { error } = await supabase
      .from('travel_agencies')
      .update({
        default_cancellation_policy: data.cancellation_policy || null,
        default_terms_conditions: data.terms_conditions || null,
      })
      .eq('id', user.id);
    setSavingDefaults(false);
    if (error) {
      toast.error(t('common.updateError', 'Something went wrong'));
      return;
    }
    toast.success(t('packageWizard.defaultsSaved', 'Saved as your agency defaults'));
  };

  return (
    <div className="space-y-6">
      <BasePricing
        data={{ basePrice: data.basePrice }}
        onUpdate={(field, value) => setField(field as 'basePrice', value)}
      />

      {/* International flights — bundled or booked by the traveler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-start">
            <Plane className="w-5 h-5" />
            {t('packageWizard.flightsTitle', 'International flights')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.flight_option}
            onValueChange={(value) => setField("flight_option", value as FlightOption)}
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="not_included" id="flights-not-included" className="mt-1" />
              <Label htmlFor="flights-not-included" className="cursor-pointer text-start">
                <span className="font-medium block">{t('packageWizard.flightsNotIncluded', 'Not included')}</span>
                <span className="text-sm text-muted-foreground">{t('packageWizard.flightsNotIncludedHint', 'Travelers book their own flights — shown clearly on the package page')}</span>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="included" id="flights-included" className="mt-1" />
              <Label htmlFor="flights-included" className="cursor-pointer text-start">
                <span className="font-medium block">{t('packageWizard.flightsIncluded', 'Included in the package price')}</span>
                <span className="text-sm text-muted-foreground">{t('packageWizard.flightsIncludedHint', 'Your base price covers international flights')}</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <InclusionsManager
        inclusions={data.inclusions}
        onToggle={handleInclusionToggle}
        onAddDetail={addInclusionDetail}
        onRemoveDetail={removeInclusionDetail}
      />

      {/* Additional Inclusions — EN and AR side by side */}
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

          <div className="space-y-3 border-t pt-4">
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
        </CardContent>
      </Card>

      {/* Exclusions — EN and AR side by side */}
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

          <div className="space-y-3 border-t pt-4">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={saveAsAgencyDefaults}
            disabled={savingDefaults || (!data.cancellation_policy && !data.terms_conditions)}
            className="flex items-center gap-2"
          >
            {savingDefaults ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
            {t('packageWizard.saveAsDefaults', 'Save as agency default')}
          </Button>
          <p className="text-xs text-muted-foreground text-start">
            {t('packageWizard.defaultsHint', 'Defaults are pre-filled into every new package you create.')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
