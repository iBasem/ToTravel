import { useState } from "react";
import { useTranslation } from "react-i18next";
import { addDays } from "date-fns";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Calendar, Users, Clock, AlertCircle, Loader2 } from "lucide-react";
import { DepartureCard } from "./DepartureCard";
import type { Departure, MonthlyAvailability } from "@/features/packages/types";

interface AvailabilitySectionProps {
    packageId: string;
    departures: Departure[];
    monthlyAvailability: MonthlyAvailability[];
    selectedMonth: string | null;
    onMonthChange: (month: string | null) => void;
    onConfirmDates: (departure: Departure) => void;
    durationDays: number;
    loading?: boolean;
}

export function AvailabilitySection({
    packageId,
    departures,
    monthlyAvailability,
    selectedMonth,
    onMonthChange,
    onConfirmDates,
    durationDays,
    loading = false,
}: AvailabilitySectionProps) {
    const { t } = useTranslation();
    const [travellers, setTravellers] = useState("2");

    // Promo end date (14 days from now for demo)
    const promoEndDate = formatDate(addDays(new Date(), 14), 'd MMM, yyyy');

    // Traveller options
    const travellerOptions = Array.from({ length: 10 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1} ${i === 0 ? t('packageDetails.adult', 'Adult') : t('packageDetails.adults', 'Adults')}`
    }));

    return (
        <div id="availability-section" className="scroll-mt-6">
            {/* Section Header */}
            <h2 className="text-2xl font-bold text-foreground mb-2 text-start">
                {t('packageDetails.datesAndAvailability', 'Dates & Availability')}
            </h2>
            <p className="text-muted-foreground mb-6 text-start">
                {t('packageDetails.selectDepartureMonthAndTravellers', 'Select departure month and travellers')}
            </p>

            {/* Filter Bar - Inline Layout */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        {/* Month Selector */}
                        <div className="flex-1 md:max-w-[250px]">
                            <Select
                                value={selectedMonth || 'all'}
                                onValueChange={(val) => onMonthChange(val === 'all' ? null : val)}
                            >
                                <SelectTrigger className="h-12 bg-background">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder={t('packageDetails.anyMonth', 'Any Month')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('packageDetails.anyMonth', 'Any Month')}
                                    </SelectItem>
                                    {monthlyAvailability.map((month) => (
                                        <SelectItem key={month.month} value={month.month}>
                                            {month.monthLabel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Travellers Selector */}
                        <div className="flex-1 md:max-w-[200px]">
                            <Select value={travellers} onValueChange={setTravellers}>
                                <SelectTrigger className="h-12 bg-background">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {travellerOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Check Availability Button */}
                        <Button
                            className="h-12 px-6 bg-teal-600 hover:bg-teal-700 text-white font-medium md:ms-auto"
                            onClick={() => {
                                const section = document.getElementById('upcoming-departures');
                                if (section) {
                                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                        >
                            {t('packageDetails.checkAvailability', 'Check Availability')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Departures Section */}
            <div id="upcoming-departures">
                <h3 className="text-lg font-semibold text-foreground mb-4 text-start">
                    {t('packageDetails.upcomingDepartures', 'Upcoming Departures')}
                </h3>

                {/* Promo Banner */}
                {departures.some(d => d.discount_price !== null) && (
                    <div className="flex items-center justify-between p-4 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <span className="text-muted-foreground">
                                {t('packageDetails.hurryDealsLimited', 'Hurry, deals only available for a limited time!')}
                            </span>
                        </div>
                        <span className="text-sm">
                            {t('packageDetails.endsOn', 'Ends on')} <span className="text-destructive font-semibold">{promoEndDate}</span>
                        </span>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        <span className="ms-3 text-muted-foreground">{t('common.loading', 'Loading...')}</span>
                    </div>
                )}

                {/* Empty State */}
                {!loading && departures.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <h4 className="font-medium text-muted-foreground mb-1">
                                {t('packageDetails.noDeparturesFound', 'No departures found')}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {selectedMonth
                                    ? t('packageDetails.tryDifferentMonth', 'Try selecting a different month')
                                    : t('packageDetails.checkBackLater', 'Please check back later for available dates')
                                }
                            </p>
                            {selectedMonth && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => onMonthChange(null)}
                                >
                                    {t('packageDetails.clearFilter', 'Clear Filter')}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Departure Cards List */}
                {!loading && departures.length > 0 && (
                    <div className="space-y-4">
                        {departures.map((departure) => (
                            <DepartureCard
                                key={departure.id}
                                departure={departure}
                                durationDays={durationDays}
                                onConfirm={() => onConfirmDates(departure)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
