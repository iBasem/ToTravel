/**
 * TypeScript interfaces for the PackageDetail page redesign
 * Supports the TourRadar-style availability and booking system
 */

// Departure/Availability types - generated from existing package data
export interface Departure {
    id: string;
    tour_id: string;
    start_date: string; // ISO Date
    end_date: string; // ISO Date
    seats_remaining: number;
    price: number;
    discount_price: number | null;
    status: 'available' | 'limited' | 'sold_out';
}

// Monthly availability summary for the date selector popover
export interface MonthlyAvailability {
    month: string; // Format: "YYYY-MM"
    monthLabel: string; // e.g., "June 2026"
    startingPrice: number;
    departureCount: number;
}

// Props for the BookingWidget component
export interface BookingWidgetProps {
    packageData: {
        id: string;
        title: string;
        base_price: number;
        available_from: string;
        available_to: string;
        duration_days: number;
        max_participants: number;
    };
    onCheckAvailability: () => void;
    onSelectMonth: (month: string) => void;
}

// Props for the DateSelectorPopover component
export interface DateSelectorPopoverProps {
    availableMonths: MonthlyAvailability[];
    onMonthSelect: (month: string) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

// Props for the AvailabilitySection component
export interface AvailabilitySectionProps {
    packageId: string;
    departures: Departure[];
    selectedMonth: string | null;
    onConfirmDates: (departure: Departure) => void;
    loading?: boolean;
}

// Props for individual DepartureCard component
export interface DepartureCardProps {
    departure: Departure;
    durationDays: number;
    onConfirm: () => void;
}

// Props for the HeroGallery component
export interface HeroGalleryProps {
    images: Array<{
        id: string;
        file_path: string;
        file_name: string;
        media_type: string;
        caption: string;
        is_primary: boolean;
        display_order: number;
    }>;
    title: string;
    isBestSeller?: boolean;
}

// Props for the WhatsIncluded component
export interface WhatsIncludedProps {
    inclusions: string[];
    exclusions: string[];
}

// Props for the OperatorInfo component
export interface OperatorInfoProps {
    agency: {
        id?: string;
        company_name: string;
        contact_person_first_name: string;
        contact_person_last_name: string;
        email: string;
        phone: string;
    };
    rating?: number;
    reviewCount?: number;
}
