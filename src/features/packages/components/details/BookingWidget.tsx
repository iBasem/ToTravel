import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Separator } from "@/ui/separator";
import {
    Calendar,
    Heart,
    MessageCircle,
    Shield,
    ChevronDown,
    Clock,
    Users,
    MapPin
} from "lucide-react";
import type { MonthlyAvailability } from "@/features/packages/types";

interface BookingWidgetProps {
    packageData: {
        id: string;
        title: string;
        base_price: number;
        available_from: string;
        available_to: string;
        duration_days: number;
        duration_nights: number;
        max_participants: number;
        destination: string;
    };
    monthlyAvailability: MonthlyAvailability[];
    onSelectMonth: (month: string) => void;
    onCheckAvailability: () => void;
}

export function BookingWidget({
    packageData,
    monthlyAvailability,
    onSelectMonth,
    onCheckAvailability
}: BookingWidgetProps) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    // Find the lowest price across all months
    const lowestPrice = monthlyAvailability.length > 0
        ? Math.min(...monthlyAvailability.map(m => m.startingPrice))
        : packageData.base_price;

    const handleMonthSelect = (month: string) => {
        setDatePopoverOpen(false);
        onSelectMonth(month);

        // Smooth scroll to availability section
        setTimeout(() => {
            const section = document.getElementById('availability-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <Card className="sticky top-6 shadow-lg border-0 ring-1 ring-gray-200">
            <CardContent className="p-6 space-y-5">
                {/* Price Section */}
                <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                        {t('packageDetails.from', 'From')}
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                            {formatCurrency(lowestPrice)}
                        </span>
                        <span className="text-gray-500 text-sm">
                            {t('packageDetails.perPerson', '/ person')}
                        </span>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{packageData.duration_days} {t('common.days')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>{t('packageDetails.max')} {packageData.max_participants}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="truncate">{packageData.destination}</span>
                    </div>
                </div>

                {/* Select Dates Popover */}
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-12 text-start font-normal"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{t('packageDetails.selectDates', 'Select Dates')}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${datePopoverOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align={isRTL ? "end" : "start"}>
                        <div className="p-4 border-b bg-gray-50">
                            <h4 className="font-semibold text-gray-900">
                                {t('packageDetails.chooseDepartureMonth', 'Choose Departure Month')}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('packageDetails.selectMonthPrompt', 'Select a month to see available dates')}
                            </p>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {monthlyAvailability.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {monthlyAvailability.map((month) => (
                                        <button
                                            key={month.month}
                                            onClick={() => handleMonthSelect(month.month)}
                                            className="p-3 text-start rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900 text-sm">
                                                {month.monthLabel}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {t('packageDetails.fromPrice', 'From')} {formatCurrency(month.startingPrice)}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-0.5">
                                                {month.departureCount} {t('packageDetails.departures', 'departures')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500">
                                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">{t('packageDetails.noDepartures', 'No departures available')}</p>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Check Availability CTA */}
                <Button
                    onClick={onCheckAvailability}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base shadow-md"
                    size="lg"
                >
                    {t('packageDetails.checkAvailability', 'Check Availability')}
                </Button>

                <Separator />

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className={`flex items-center justify-center gap-2 h-10 ${isWishlisted ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                        onClick={() => setIsWishlisted(!isWishlisted)}
                    >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                        <span className="text-sm">{t('packageDetails.save', 'Save')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 h-10"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{t('packageDetails.askQuestion', 'Ask')}</span>
                    </Button>
                </div>

                {/* Trust Badge */}
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span>{t('packageDetails.secureBooking', 'Secure Booking')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {t('packageDetails.noPaymentRequired', 'No payment required today')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
