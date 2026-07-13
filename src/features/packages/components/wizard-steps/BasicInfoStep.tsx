
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { X, Plus, Heart, Users, UsersRound, User } from "lucide-react";
import { cn } from "@/lib/utils";

import type { PackageFormData, PackageType } from "@/features/packages/types/wizard";
import { PACKAGE_TYPES } from "@/features/packages/types/wizard";

interface BasicInfoStepProps {
  data: PackageFormData['basicInfo'];
  onUpdate: (data: PackageFormData['basicInfo']) => void;
}

const TYPE_ICONS: Record<PackageType, typeof Heart> = {
  honeymoon: Heart,
  family: Users,
  group: UsersRound,
  solo: User,
};

// Experience categories — 'family' is a package_type (audience), not a
// category; 'nature' and 'beach' exist in live data and are real options.
const CATEGORIES = ['adventure', 'cultural', 'relaxation', 'luxury', 'budget', 'nature', 'beach'] as const;

// Controlled section: reads from `data`, writes through `onUpdate`. Only the
// pending-highlight scratch input lives locally. The destination label is
// auto-derived from the route stops in the Plan section; editing it here
// overrides the derivation.
export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  const { t } = useTranslation();

  const highlights = data.highlights ?? [];
  const [newHighlight, setNewHighlight] = useState("");

  const handleInputChange = (field: string, value: string | number | boolean) => {
    onUpdate({ ...data, [field]: value });
  };

  // The type drives smart defaults: honeymoon is always a couple; family
  // trips default to easy difficulty (still editable).
  const handleTypeChange = (type: PackageType) => {
    const next = { ...data, package_type: type };
    if (type === 'honeymoon') {
      next.max_participants = 2;
    }
    if (type === 'family' && data.difficulty_level === 'moderate') {
      next.difficulty_level = 'easy';
    }
    onUpdate(next);
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      onUpdate({ ...data, highlights: [...highlights, newHighlight.trim()] });
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    onUpdate({ ...data, highlights: highlights.filter((_, i) => i !== index) });
  };

  const isHoneymoon = data.package_type === 'honeymoon';

  return (
    <div className="space-y-6">
      {/* Package type — who this trip is for */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.packageTypeTitle', 'Who is this package for?')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="radiogroup" aria-label={t('packageWizard.packageTypeTitle', 'Who is this package for?')}>
            {PACKAGE_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              const selected = data.package_type === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                  {t(`packageWizard.type_${type}`)}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-3 text-start">
            {t(`packageWizard.typeHint_${data.package_type}`)}
          </p>
        </CardContent>
      </Card>

      {/* Basic Package Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.basicPackageInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-start block">{t('packageWizard.packageTitle')} *</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t('packageWizard.packageTitlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_ar" className="text-start block">{t('packageWizard.titleAr', 'Title (Arabic)')}</Label>
              <Input
                id="title_ar"
                dir="rtl"
                value={data.title_ar}
                onChange={(e) => handleInputChange("title_ar", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-start block">{t('packageWizard.destinationLabel', 'Destination label')}</Label>
              <Input
                id="destination"
                value={data.destination}
                onChange={(e) => handleInputChange("destination", e.target.value)}
                placeholder={t('packageWizard.destinationAutoHint', 'Filled automatically from your route stops')}
              />
              <p className="text-xs text-muted-foreground text-start">
                {t('packageWizard.destinationAutoHint', 'Filled automatically from your route stops')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination_ar" className="text-start block">{t('packageWizard.destinationAr', 'Destination (Arabic)')}</Label>
              <Input
                id="destination_ar"
                dir="rtl"
                value={data.destination_ar}
                onChange={(e) => handleInputChange("destination_ar", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-start block">{t('packageWizard.category')} *</Label>
              <Select value={data.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('packageWizard.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`packageWizard.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isHoneymoon && (
              <div className="space-y-2">
                <Label htmlFor="difficulty_level" className="text-start block">{t('packageWizard.difficultyLevel')}</Label>
                <Select value={data.difficulty_level} onValueChange={(value) => handleInputChange("difficulty_level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('packageWizard.selectDifficulty')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t('packageWizard.easy')}</SelectItem>
                    <SelectItem value="moderate">{t('packageWizard.moderate')}</SelectItem>
                    <SelectItem value="challenging">{t('packageWizard.challenging')}</SelectItem>
                    <SelectItem value="expert">{t('packageWizard.expert')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="duration_days" className="text-start block">{t('packageWizard.durationDays')}</Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                value={data.duration_days}
                onChange={(e) => handleInputChange("duration_days", parseInt(e.target.value) || 1)}
                placeholder="14"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground text-start">
                {t('packageWizard.durationAutoHint', 'Follows your day plan; edit to override')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_nights" className="text-start block">{t('packageWizard.durationNights')}</Label>
              <Input
                id="duration_nights"
                type="number"
                min="0"
                value={data.duration_nights}
                onChange={(e) => handleInputChange("duration_nights", parseInt(e.target.value) || 0)}
                placeholder="13"
                dir="ltr"
              />
            </div>

            {isHoneymoon ? (
              <div className="space-y-2">
                <Label className="text-start block">{t('packageWizard.maxParticipants')}</Label>
                <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 text-start">
                  {t('packageWizard.honeymoonCoupleNote', 'Fixed at 2 — honeymoon packages are for couples')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="max_participants" className="text-start block">{t('packageWizard.maxParticipants')}</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  value={data.max_participants}
                  onChange={(e) => handleInputChange("max_participants", parseInt(e.target.value) || 20)}
                  placeholder="16"
                  dir="ltr"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-start block">{t('packageWizard.description')} *</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t('packageWizard.descriptionPlaceholder')}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_ar" className="text-start block">{t('packageWizard.descriptionAr', 'Description (Arabic)')}</Label>
              <Textarea
                id="description_ar"
                dir="rtl"
                value={data.description_ar}
                onChange={(e) => handleInputChange("description_ar", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-start">
            {t('packageWizard.arabicContentHint', 'Shown to Arabic-speaking travelers; English is used when empty')}
          </p>
        </CardContent>
      </Card>

      {/* Package Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.packageHighlights')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              placeholder={t('packageWizard.addHighlight')}
              onKeyPress={(e) => e.key === "Enter" && addHighlight()}
            />
            <Button type="button" onClick={addHighlight} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {highlight}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeHighlight(index)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
