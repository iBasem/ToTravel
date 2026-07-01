
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import { MapPin, Clock, Users, Star, Image } from "lucide-react";

interface ReviewStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function ReviewStep({ data, onUpdate }: ReviewStepProps) {
  const { t, i18n } = useTranslation();
  const { basicInfo, itinerary, pricing, media } = data;

  const handlePublishToggle = (isPublished: boolean) => {
    onUpdate({ ...data, isPublished });
  };

  return (
    <div className="space-y-6">
      <div className="text-start">
        <h3 className="text-lg font-semibold mb-2">{t('packageWizard.reviewYourPackage')}</h3>
        <p className="text-muted-foreground">{t('packageWizard.reviewAllDetails')}</p>
      </div>

      {/* Package Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.packagePreview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Image */}
            <div className="lg:col-span-2">
              {media.length > 0 ? (
                <img
                  src={media.find((m: any) => m.isPrimary)?.url || media[0]?.url}
                  alt={basicInfo.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Package Info */}
            <div className="space-y-4 text-start">
              <div>
                <h2 className="text-xl font-bold">{basicInfo.title || t('packageWizard.packageTitle')}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="capitalize">{basicInfo.destination || t('packageWizard.destination')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{basicInfo.duration || t('tours.duration')}</span>
                </div>
                {basicInfo.maxGroupSize && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{t('tours.max')} {basicInfo.maxGroupSize}</span>
                  </div>
                )}
                {basicInfo.difficulty && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <Badge variant="outline" className="capitalize">
                      {basicInfo.difficulty}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: pricing.currency || 'USD' }).format(Number(pricing.basePrice) || 0)}
                </div>
                <div className="text-sm text-muted-foreground">{t('packageWizard.perPerson')}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 text-start">
            <h3 className="font-semibold mb-2">{t('packageWizard.description')}</h3>
            <p className="text-muted-foreground">{basicInfo.description || t('packageWizard.noDescriptionProvided')}</p>
          </div>

          {/* Highlights */}
          {basicInfo.highlights && basicInfo.highlights.length > 0 && (
            <div className="mt-6 text-start">
              <h3 className="font-semibold mb-2">{t('packageWizard.highlights')}</h3>
              <div className="flex flex-wrap gap-2">
                {basicInfo.highlights.map((highlight: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{itinerary.length}</div>
            <div className="text-sm text-muted-foreground">{t('packageWizard.days')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{media.length}</div>
            <div className="text-sm text-muted-foreground">{t('packageWizard.mediaFiles')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(pricing.inclusions || {}).filter(Boolean).length}
            </div>
            <div className="text-sm text-muted-foreground">{t('packageWizard.inclusions')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: pricing.currency || 'USD' }).format(Number(pricing.basePrice) || 0)}
            </div>
            <div className="text-sm text-muted-foreground">{t('packageWizard.basePrice')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('packageWizard.publishingOptions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="publish"
              checked={data.isPublished}
              onCheckedChange={handlePublishToggle}
            />
            <Label htmlFor="publish" className="cursor-pointer">{t('packageWizard.publishImmediately')}</Label>
          </div>

          <div className="text-sm text-muted-foreground text-start">
            {data.isPublished ? (
              <p>✓ {t('packageWizard.willBePublished')}</p>
            ) : (
              <p>{t('packageWizard.savedAsDraft')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
