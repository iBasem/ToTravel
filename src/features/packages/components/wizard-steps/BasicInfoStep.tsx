
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { X, Plus, Search, Loader2, MapPin } from "lucide-react";

import type { PackageFormData } from "@/features/packages/types/wizard";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface BasicInfoStepProps {
  data: PackageFormData['basicInfo'];
  onUpdate: (data: PackageFormData['basicInfo']) => void;
}

interface DestinationResult {
  id: string;
  name: string;
  placeName: string;
}

// Minimal shape of a Mapbox geocoding feature (the fields we read).
interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
}

// Controlled section: reads from `data`, writes through `onUpdate`. Only
// UI scratch state (search box, pending highlight) lives locally.
export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  const { t } = useTranslation();

  const destinations = data.destinations ?? (data.destination ? [data.destination] : []);
  const highlights = data.highlights ?? [];

  const [newHighlight, setNewHighlight] = useState("");

  // Destination search state
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<DestinationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchDestinations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDestinationResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=country,region&limit=5`
      );
      const result = await response.json();

      if (result.features) {
        const results: DestinationResult[] = result.features.map((feature: MapboxFeature) => ({
          id: feature.id,
          name: feature.text,
          placeName: feature.place_name,
        }));
        setDestinationResults(results);
        setShowResults(true);
      } else {
        setDestinationResults([]);
      }
    } catch (error) {
      console.error('Error searching destinations:', error);
      setDestinationResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (destinationQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchDestinations(destinationQuery);
      }, 300);
    } else {
      setDestinationResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [destinationQuery, searchDestinations]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleDestinationSelect = (result: DestinationResult) => {
    if (!destinations.includes(result.name)) {
      const newDestinations = [...destinations, result.name];
      onUpdate({
        ...data,
        destinations: newDestinations,
        // Keep backward compatibility with single destination field
        destination: newDestinations[0] || ""
      });
    }
    setDestinationQuery("");
    setShowResults(false);
    setDestinationResults([]);
  };

  const removeDestination = (index: number) => {
    const newDestinations = destinations.filter((_: string, i: number) => i !== index);
    onUpdate({
      ...data,
      destinations: newDestinations,
      destination: newDestinations[0] || ""
    });
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

  return (
    <div className="space-y-6">
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

            <div className="space-y-2 md:col-span-2">
              <Label className="text-start block">{t('packageWizard.destination')} *</Label>
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 start-3" />
                {isSearching && (
                  <Loader2 className="absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground z-10 end-3" />
                )}
                <Input
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  onFocus={() => destinationResults.length > 0 && setShowResults(true)}
                  placeholder={t('packageWizard.destinationPlaceholder')}
                  className="ps-10"
                />

                {showResults && destinationResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {destinationResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        className="w-full p-3 hover:bg-muted flex items-center gap-3 border-b last:border-b-0 transition-colors text-start"
                        onClick={() => handleDestinationSelect(result)}
                      >
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{result.placeName}</p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {showResults && destinationQuery.length >= 2 && destinationResults.length === 0 && !isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                    {t('packageWizard.noResultsFound', 'No destinations found')}
                  </div>
                )}
              </div>

              {/* Selected destinations as badges */}
              {destinations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {destinations.map((dest: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                      <MapPin className="w-3 h-3" />
                      {dest}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive ms-1"
                        onClick={() => removeDestination(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-start block">{t('packageWizard.category')} *</Label>
              <Select value={data.category} onValueChange={(value) => handleInputChange("category", value)}>
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
              <Label htmlFor="duration_days" className="text-start block">{t('packageWizard.durationDays')} *</Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                value={data.duration_days}
                onChange={(e) => handleInputChange("duration_days", parseInt(e.target.value) || 1)}
                placeholder="14"
                dir="ltr"
              />
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
          </div>

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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="destination_ar" className="text-start block">{t('packageWizard.destinationAr', 'Destination (Arabic)')}</Label>
              <Input
                id="destination_ar"
                dir="rtl"
                value={data.destination_ar}
                onChange={(e) => handleInputChange("destination_ar", e.target.value)}
              />
            </div>
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
