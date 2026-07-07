import { useTranslation } from "react-i18next";
import { Badge } from "@/ui/badge";
import { Star, Clock, Users, MapPin, Heart, Share2 } from "lucide-react";
import { Button } from "@/ui/button";
import { localizedText } from "@/lib/localized";
import type { PackageDetails } from "@/features/packages/hooks/usePackageDetails";

interface TourHeaderProps {
    packageData: PackageDetails;
}

export function TourHeader({ packageData }: TourHeaderProps) {
    const { t } = useTranslation();
    const title = localizedText(packageData, 'title');
    const destination = localizedText(packageData, 'destination');
    const description = localizedText(packageData, 'description');

    const getTourTypeBadgeColor = (type: string) => {
        switch (type) {
            case "group": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
            case "private": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
            case "customizable": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    const hasRating = (packageData.average_rating || 0) > 0;

    return (
        <div className="py-4 text-start">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {packageData.featured && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        ★ {t('common.featured', 'Featured')}
                    </Badge>
                )}
                <Badge className={`capitalize ${getTourTypeBadgeColor(packageData.category)}`}>
                    {t(`categories.${packageData.category}`, { defaultValue: packageData.category })} {t('tours.tour', 'Tour')}
                </Badge>
                <Badge variant="outline" className="bg-muted/50">
                    {t(`difficulty.${(packageData.difficulty_level || 'moderate').toLowerCase()}`, { defaultValue: packageData.difficulty_level || 'Moderate' })}
                </Badge>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                {title}
            </h1>

            {/* Rating & Quick Stats Row */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                    <div className={`flex items-center gap-0.5 px-2 py-1 rounded-md ${hasRating ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                        <Star className={`w-4 h-4 ${hasRating ? 'text-green-600 dark:text-green-400 fill-current' : 'text-muted-foreground'}`} />
                        <span className={`font-semibold ${hasRating ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                            {hasRating ? packageData.average_rating?.toFixed(1) : t('packageDetails.new', 'New')}
                        </span>
                    </div>
                    <span className="text-muted-foreground">
                        ({packageData.total_reviews || 0} {t('common.reviews', 'reviews')})
                    </span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{packageData.duration_days} {t('common.days', 'days')}</span>
                </div>

                {/* Group Size */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{t('packageDetails.max', 'Max')} {packageData.max_participants}</span>
                </div>

                {/* Destination */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{destination}</span>
                </div>
            </div>

            {/* Description (truncated) */}
            {description && (
                <p className="mt-4 text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3">
                    {description}
                </p>
            )}

            {/* Action Buttons (Mobile visible, Desktop hidden - they're in sidebar) */}
            <div className="flex gap-2 mt-4 lg:hidden">
                <Button variant="outline" size="sm" className="flex-1">
                    <Heart className="w-4 h-4 me-2" />
                    {t('packageDetails.save', 'Save')}
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="w-4 h-4 me-2" />
                    {t('packageDetails.share', 'Share')}
                </Button>
            </div>
        </div>
    );
}
