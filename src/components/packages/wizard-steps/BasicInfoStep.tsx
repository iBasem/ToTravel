
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Search, Loader2 } from "lucide-react";

interface BasicInfoStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    destination: "",
    duration: "",
    maxGroupSize: "",
    packageType: "group",
    highlights: [],
    newHighlight: "",
    rating: 4.5,
    category: "",
    difficulty_level: "moderate",
    duration_days: 1,
    duration_nights: 0,
    max_participants: 20,
    featured: false,
    ...data
  });

  // Destination search state
  const [destinationQuery, setDestinationQuery] = useState(data?.destination || "");
  const [destinationResults, setDestinationResults] = useState<Array<{ id: string; name: string; placeName: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchDestinations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDestinationResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTl5cjByNmMwMzRsMmtzOGo2Y2xtOGU1In0.5M6BSu3cYkuAdCB0QjVIXQ&types=country,region&limit=5`
      );
      const data = await response.json();
      const results = data.features?.map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        placeName: feature.place_name,
      })) || [];
      setDestinationResults(results);
    } catch (error) {
      console.error('Error searching destinations:', error);
      setDestinationResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced destination search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (destinationQuery && destinationQuery !== formData.destination) {
        searchDestinations(destinationQuery);
        setShowResults(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [destinationQuery, searchDestinations, formData.destination]);

  const handleDestinationSelect = (result: { name: string; placeName: string }) => {
    setDestinationQuery(result.name);
    handleInputChange("destination", result.name);
    setShowResults(false);
    setDestinationResults([]);
  };

  useEffect(() => {
    console.log('BasicInfoStep formData updated:', formData);
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    console.log(`Updating field ${field} with value:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addHighlight = () => {
    if (formData.newHighlight.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, prev.newHighlight.trim()],
        newHighlight: ""
      }));
    }
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };


  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Basic Package Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('packageWizard.basicPackageInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('packageWizard.packageTitle')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t('packageWizard.packageTitlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">{t('packageWizard.packageSubtitle')}</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder={t('packageWizard.packageSubtitlePlaceholder')}
              />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="destination">{t('packageWizard.destination')} *</Label>
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                {isSearching && (
                  <Loader2 className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground ${isRTL ? 'left-3' : 'right-3'}`} />
                )}
                <Input
                  id="destination"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  onFocus={() => destinationResults.length > 0 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder={t('packageWizard.destinationPlaceholder')}
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>
              {showResults && destinationResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {destinationResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                      onClick={() => handleDestinationSelect(result)}
                    >
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">{result.placeName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('packageWizard.category')} *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('packageWizard.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adventure">{t('packageWizard.adventure')}</SelectItem>
                  <SelectItem value="cultural">{t('packageWizard.cultural')}</SelectItem>
                  <SelectItem value="relaxation">{t('packageWizard.relaxation')}</SelectItem>
                  <SelectItem value="family">{t('packageWizard.family')}</SelectItem>
                  <SelectItem value="luxury">{t('packageWizard.luxury')}</SelectItem>
                  <SelectItem value="budget">{t('packageWizard.budget')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_days">{t('packageWizard.durationDays')} *</Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) => handleInputChange("duration_days", parseInt(e.target.value) || 1)}
                placeholder="14"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_nights">{t('packageWizard.durationNights')}</Label>
              <Input
                id="duration_nights"
                type="number"
                min="0"
                value={formData.duration_nights}
                onChange={(e) => handleInputChange("duration_nights", parseInt(e.target.value) || 0)}
                placeholder="13"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">{t('packageWizard.maxParticipants')}</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) => handleInputChange("max_participants", parseInt(e.target.value) || 20)}
                placeholder="16"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty_level">{t('packageWizard.difficultyLevel')}</Label>
              <Select value={formData.difficulty_level} onValueChange={(value) => handleInputChange("difficulty_level", value)}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('packageWizard.description')} *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={t('packageWizard.descriptionPlaceholder')}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Package Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>{t('packageWizard.packageHighlights')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Input
              value={formData.newHighlight}
              onChange={(e) => handleInputChange("newHighlight", e.target.value)}
              placeholder={t('packageWizard.addHighlight')}
              onKeyPress={(e) => e.key === "Enter" && addHighlight()}
            />
            <Button type="button" onClick={addHighlight} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.highlights.map((highlight: string, index: number) => (
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
