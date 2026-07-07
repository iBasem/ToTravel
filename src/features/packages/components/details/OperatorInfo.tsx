import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Star, ExternalLink, Shield, Clock, CheckCircle } from "lucide-react";
import type { OperatorInfoProps } from "@/features/packages/types";

export function OperatorInfo({ agency, rating = 4.5, reviewCount = 0 }: OperatorInfoProps) {
    const { t } = useTranslation();

    if (!agency) return null;

    const initials = agency.company_name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const colors = [
        'bg-blue-600',
        'bg-green-600',
        'bg-purple-600',
        'bg-orange-600',
        'bg-teal-600',
        'bg-indigo-600',
    ];
    const colorIndex = agency.company_name.length % colors.length;
    const avatarColor = colors[colorIndex];

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Header with gradient */}
                <div className="bg-primary px-6 py-4">
                    <p className="text-primary-foreground/80 text-sm">
                        {t('packageDetails.operatedBy', 'Operated by')}
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className={`w-16 h-16 ${avatarColor} text-white text-xl font-bold`}>
                            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 text-start">
                            <h3 className="text-lg font-bold text-foreground">
                                {agency.company_name}
                            </h3>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                                </div>
                                {reviewCount > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        ({reviewCount} {t('common.reviews', 'reviews')})
                                    </span>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {t('packageDetails.verified', 'Verified')}
                                </Badge>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {t('packageDetails.responds24h', 'Responds in 24h')}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">50+</p>
                            <p className="text-xs text-muted-foreground">{t('packageDetails.tours', 'Tours')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">5+</p>
                            <p className="text-xs text-muted-foreground">{t('packageDetails.yearsExp', 'Years Exp.')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">1K+</p>
                            <p className="text-xs text-muted-foreground">{t('packageDetails.travelers', 'Travelers')}</p>
                        </div>
                    </div>

                    {/* Trust Badge */}
                    <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <Shield className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>{t('packageDetails.moneyBackGuarantee', 'Money-back guarantee if tour is cancelled')}</span>
                    </div>

                    {/* Action Button */}
                    <Button
                        variant="outline"
                        className="w-full mt-4 flex items-center justify-center gap-2"
                    >
                        {t('packageDetails.viewOperatorProfile', 'View Operator Profile')}
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
