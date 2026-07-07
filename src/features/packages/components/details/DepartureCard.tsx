import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Zap, Globe, Clock, ArrowRight, Bed } from "lucide-react";
import type { Departure } from "@/features/packages/types";

interface DepartureCardProps {
    departure: Departure;
    durationDays: number;
    onConfirm: () => void;
}

export function DepartureCard({ departure, durationDays, onConfirm }: DepartureCardProps) {
    const { t, i18n } = useTranslation();

    const startDate = parseISO(departure.start_date);
    const endDate = parseISO(departure.end_date);

    const hasDiscount = departure.discount_price !== null && departure.discount_price < departure.price;
    const displayPrice = hasDiscount ? departure.discount_price! : departure.price;
    const discountPercent = hasDiscount
        ? Math.round((1 - departure.discount_price! / departure.price) * 100)
        : 0;

    return (
        <Card className={`relative transition-all hover:shadow-md border ${departure.seats_remaining === 0 ? 'opacity-60 bg-muted/50' : 'bg-card'
            }`}>
            {/* Discount Badge - Top End Corner */}
            {hasDiscount && (
                <Badge className="absolute top-4 end-4 bg-red-500 text-white font-semibold px-2 py-1">
                    -{discountPercent}%
                </Badge>
            )}

            <CardContent className="p-5">
                {/* Instant Confirmation Badge */}
                <div className="mb-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Zap className="w-3.5 h-3.5 me-1.5 fill-current" />
                        {t('packageDetails.instantConfirmation', 'Instant Confirmation')}
                    </Badge>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left: Dates Section */}
                    <div className="flex-1 text-start">
                        {/* Date Display */}
                        <div className="flex items-center gap-3 mb-3">
                            {/* From Date */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">
                                    {t('packageDetails.from', 'From')} {format(startDate, 'EEEE')}
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                    {format(startDate, 'd MMM, yyyy')}
                                </p>
                            </div>

                            {/* Arrow */}
                            <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 rtl:rotate-180" />

                            {/* To Date */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">
                                    {t('packageDetails.to', 'To')} {format(endDate, 'EEEE')}
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                    {format(endDate, 'd MMM, yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Language Badge */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            <span>{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
                        </div>
                    </div>

                    {/* Right: Pricing Section */}
                    <div className="lg:min-w-[200px] text-end">
                        {/* Price Label */}
                        <p className="text-sm text-muted-foreground mb-1">
                            {t('packageDetails.from', 'From')}:
                        </p>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 justify-end">
                            {hasDiscount && (
                                <span className="text-sm text-muted-foreground line-through">
                                    ${departure.price.toLocaleString()}
                                </span>
                            )}
                            <span className={`text-2xl font-bold ${hasDiscount ? 'text-green-600' : 'text-foreground'}`}>
                                US ${displayPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {t('packageDetails.perPerson', 'per person')}
                            </span>
                        </div>

                        {/* Price Note */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 justify-end">
                            <Bed className="w-3.5 h-3.5" />
                            <span>{t('packageDetails.priceBasedOnSharedRoom', 'Price based on Shared Room')}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                    {/* Seats Status */}
                    {departure.seats_remaining > 0 && departure.seats_remaining <= 6 && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-600 font-medium">
                                {departure.seats_remaining} {t('packageDetails.seatsLeft', 'seats left')}
                            </span>
                        </div>
                    )}

                    {/* Spacer if no seats warning */}
                    {(departure.seats_remaining === 0 || departure.seats_remaining > 6) && (
                        <div />
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline">
                            {t('packageDetails.holdSpace48h', 'Hold space for 48h')}
                        </button>
                        <Button
                            onClick={onConfirm}
                            disabled={departure.seats_remaining === 0}
                            className={`min-w-[130px] ${departure.seats_remaining === 0
                                ? 'bg-muted cursor-not-allowed'
                                : 'bg-teal-600 hover:bg-teal-700'
                                }`}
                        >
                            {departure.seats_remaining === 0
                                ? t('packageDetails.soldOut', 'Sold Out')
                                : t('packageDetails.confirmDates', 'Confirm Dates')
                            }
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
