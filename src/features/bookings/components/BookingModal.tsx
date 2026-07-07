import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Textarea } from '@/ui/textarea';
import { Label } from '@/ui/label';
import { Calendar } from '@/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { CalendarIcon, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Departure } from '@/features/packages/types';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageId: string;
    packageTitle: string;
    basePrice: number;
    maxParticipants?: number;
    departure?: Departure | null;
}

export function BookingModal({
    isOpen,
    onClose,
    packageId,
    packageTitle,
    basePrice,
    maxParticipants = 20,
    departure,
}: BookingModalProps) {
    const { t } = useTranslation();
    const [date, setDate] = useState<Date>();
    const [participants, setParticipants] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');
    const { createBooking, loading } = useCreateBooking();
    const { user } = useAuth();
    const navigate = useNavigate();

    // When booking a specific departure, cap participants at its remaining seats.
    const effectiveMax = departure
        ? Math.max(1, Math.min(maxParticipants, departure.seats_remaining))
        : maxParticipants;
    const totalPrice = basePrice * participants;

    const handleSubmit = async () => {
        if (!user) {
            onClose();
            navigate('/auth?type=traveler&redirect=' + encodeURIComponent(`/packages/${packageId}`));
            return;
        }

        const bookingDate = departure ? departure.start_date : (date ? format(date, 'yyyy-MM-dd') : null);
        if (!bookingDate) {
            return;
        }

        const result = await createBooking({
            packageId,
            bookingDate,
            participants,
            specialRequests,
            departureId: departure?.id,
        });

        if (result.success) {
            onClose();
            navigate('/traveler/dashboard/bookings');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('booking.bookTitle', { title: packageTitle })}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Date Selection: fixed to the chosen departure, or free-pick */}
                    <div className="space-y-2">
                        <Label>{t('booking.selectDate')} *</Label>
                        {departure ? (
                            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                                <span className="flex items-center gap-2 font-medium">
                                    <CalendarIcon className="h-4 w-4" />
                                    {formatDate(new Date(departure.start_date), 'PPP')}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {t('booking.seatsLeft', { count: departure.seats_remaining, defaultValue: '{{count}} seats left' })}
                                </span>
                            </div>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-start font-normal',
                                            !date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="me-2 h-4 w-4" />
                                        {date ? formatDate(date, 'PPP') : t('booking.pickDate')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    {/* Participants */}
                    <div className="space-y-2">
                        <Label>{t('booking.numParticipants')}</Label>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setParticipants(Math.max(1, participants - 1))}
                                disabled={participants <= 1}
                            >
                                -
                            </Button>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="text-lg font-semibold w-8 text-center">{participants}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setParticipants(Math.min(effectiveMax, participants + 1))}
                                disabled={participants >= effectiveMax}
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-2">
                        <Label>{t('booking.specialRequests')}</Label>
                        <Textarea
                            placeholder={t('booking.specialRequestsPlaceholder')}
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                        />
                    </div>

                    {/* Price Summary */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span>{t('booking.pricePerPerson')}</span>
                            <span>{formatCurrency(basePrice)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>{t('booking.participants')}</span>
                            <span>× {participants}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>{t('common.total')}</span>
                            <span>{formatCurrency(totalPrice)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || (!departure && !date)}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                {t('common.processing')}
                            </>
                        ) : user ? (
                            t('booking.confirmBooking')
                        ) : (
                            t('booking.signInToBook')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
