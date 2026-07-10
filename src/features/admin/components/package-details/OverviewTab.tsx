import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Check, X, Star, Users, CalendarDays, Tag, Mountain } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { pickLocalized } from '@/lib/localized';
import type { AdminPackageRow } from '@/features/admin/hooks/useAdminPackageDetails';

interface OverviewTabProps {
  pkg: AdminPackageRow;
}

export function OverviewTab({ pkg }: OverviewTabProps) {
  const { t } = useTranslation();

  const inclusions = pickLocalized<string[]>(pkg, 'inclusions') ?? [];
  const exclusions = pickLocalized<string[]>(pkg, 'exclusions') ?? [];

  const facts = [
    {
      icon: CalendarDays,
      label: t('adminPackageDetails.duration', 'Duration'),
      value: t('adminPackageDetails.durationValue', '{{days}} days / {{nights}} nights', {
        days: pkg.duration_days,
        nights: pkg.duration_nights,
      }),
    },
    {
      icon: Users,
      label: t('adminPackageDetails.maxParticipants', 'Max participants'),
      value: pkg.max_participants != null ? formatNumber(pkg.max_participants) : '—',
    },
    {
      icon: Tag,
      label: t('adminPackageDetails.category', 'Category'),
      value: pkg.category || '—',
    },
    {
      icon: Mountain,
      label: t('adminPackageDetails.difficulty', 'Difficulty'),
      value: pkg.difficulty_level || '—',
    },
    {
      icon: Star,
      label: t('adminPackageDetails.rating', 'Rating'),
      value:
        pkg.total_reviews && pkg.total_reviews > 0
          ? t('adminPackageDetails.ratingValue', '{{rating}} ({{count}} reviews)', {
              rating: Number(pkg.average_rating ?? 0).toFixed(1),
              count: pkg.total_reviews,
            })
          : t('adminPackageDetails.noReviews', 'No reviews yet'),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Descriptions — moderators need to see both languages side by side */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('adminPackageDetails.descriptionEn', 'Description (English)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line" dir="ltr">
              {pkg.description || t('adminPackageDetails.noDescription', 'No description provided')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('adminPackageDetails.descriptionAr', 'Description (Arabic)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pkg.description_ar ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line text-start" dir="rtl">
                {pkg.description_ar}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t('adminPackageDetails.noArabicDescription', 'No Arabic description provided')}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                {t('adminPackageDetails.inclusions', 'Inclusions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inclusions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {t('adminPackageDetails.noInclusions', 'No inclusions listed')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {inclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <X className="w-4 h-4 text-destructive" aria-hidden="true" />
                {t('adminPackageDetails.exclusions', 'Exclusions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exclusions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {t('adminPackageDetails.noExclusions', 'No exclusions listed')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {exclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('adminPackageDetails.pricing', 'Pricing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(Number(pkg.base_price))}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('adminPackageDetails.basePricePerPerson', 'Base price per person')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('adminPackageDetails.keyFacts', 'Key facts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </span>
                <span className="font-medium text-end">{value}</span>
              </div>
            ))}
            {pkg.featured && (
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                {t('adminPackageDetails.featured', 'Featured')}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
