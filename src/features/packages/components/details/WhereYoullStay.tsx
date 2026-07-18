import { useTranslation } from "react-i18next";
import { Hotel, BedDouble, CalendarDays, Info, ImageOff } from "lucide-react";
import { Badge } from "@/ui/badge";
import { StarRating } from "@/features/reviews/components/StarRating";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/ui/carousel";
import { localizedText } from "@/lib/localized";
import type { PackageDetails } from "@/features/packages/hooks/usePackageDetails";

type Hotel = NonNullable<PackageDetails["package_hotels"]>[number];

/**
 * "Where You'll Stay" — the agency-authored accommodations for a package.
 * Illustrative rather than bookable: names carry the operator's own "or similar"
 * hedge and the section states outright that stays can change.
 */
export function WhereYoullStay({ hotels }: { hotels: Hotel[] }) {
    const { t } = useTranslation();
    const stays = [...hotels].sort((a, b) => a.display_order - b.display_order);

    if (stays.length === 0) return null;

    return (
        <section className="text-start">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-start">
                {t("packageDetails.whereYoullStay", "Where You'll Stay")}
            </h2>

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {t("packageDetails.staysSubjectToChange", "All accommodations are subject to change")}
            </p>

            {/*
             * The inline padding is the arrows' gutter: it insets the slide
             * viewport so the controls sit beside the cards instead of on top of
             * them, while staying inside the carousel's own box (the shadcn
             * default parks them outside, over the sticky booking card).
             * Mobile has no gutter — the arrows are hidden and cards go full width.
             */}
            <Carousel opts={{ align: "start", slidesToScroll: 1 }} className="mt-5 sm:px-12">
                <CarouselContent className="-ms-3">
                    {stays.map((hotel) => (
                        <CarouselItem key={hotel.id} className="ps-3 basis-full sm:basis-1/2 lg:basis-1/3">
                            <article className="h-full rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                                <div className="h-40 w-full bg-muted">
                                    {hotel.image_path ? (
                                        <img
                                            src={hotel.image_path}
                                            alt={localizedText(hotel, "name")}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-full place-items-center text-muted-foreground/40">
                                            <ImageOff className="h-8 w-8" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col gap-2 flex-1">
                                    <h3 className="font-semibold leading-snug" dir="auto">
                                        {localizedText(hotel, "name")}
                                    </h3>

                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Hotel className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        {t(`packageWizard.hotelKind_${hotel.kind}`, hotel.kind)}
                                    </p>

                                    {localizedText(hotel, "room_type") && (
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <BedDouble className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            <span dir="auto" className="min-w-0 truncate">{localizedText(hotel, "room_type")}</span>
                                        </p>
                                    )}

                                    {hotel.star_rating !== null && (
                                        <StarRating rating={hotel.star_rating} readonly size="sm" />
                                    )}

                                    {hotel.day_numbers.length > 0 && (
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            <span className="tabular-nums">
                                                {t("packageDetails.stayDays", {
                                                    count: hotel.day_numbers.length,
                                                    days: hotel.day_numbers.join(", "),
                                                })}
                                            </span>
                                        </p>
                                    )}

                                    {hotel.upgrade_available && (
                                        <Badge variant="secondary" className="w-fit mt-auto font-normal">
                                            {t("packageDetails.upgradeAvailable", "Upgrade Available")}
                                        </Badge>
                                    )}
                                </div>
                            </article>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {stays.length > 1 && (
                    <>
                        <CarouselPrevious className="hidden sm:flex start-1 h-9 w-9 shadow-md" />
                        <CarouselNext className="hidden sm:flex end-1 h-9 w-9 shadow-md" />
                    </>
                )}
            </Carousel>
        </section>
    );
}
