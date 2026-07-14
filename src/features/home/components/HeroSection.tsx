import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { Search } from "lucide-react";
import { DestinationField, type DestinationSelection } from "./search/DestinationField";
import { MonthField } from "./search/MonthField";
import { TravelersField } from "./search/TravelersField";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1900&h=900&fit=crop";

/**
 * Marketplace hero: one large rounded image card aligned with the content
 * column, centered headline, and a pill-shaped search bar in the lower half
 * of the card that routes to the packages listing.
 */
export function HeroSection() {
  const [destination, setDestination] = useState<DestinationSelection | null>(null);
  const [destinationText, setDestinationText] = useState("");
  const [month, setMonth] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination.slug);
    else if (destinationText.trim()) params.set("search", destinationText.trim());
    if (month) params.set("month", month);
    params.set("adults", String(adults));
    if (childrenCount > 0) params.set("children", String(childrenCount));
    navigate(`/packages?${params.toString()}`);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl min-h-[420px] sm:min-h-[480px] lg:min-h-[540px] flex flex-col items-center justify-center text-center px-4 py-10 sm:px-10 shadow-lg">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/45"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-sm">
            {t('hero.title')}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 font-medium mt-3 sm:mt-4 drop-shadow-sm">
            {t('hero.subtitle')}
          </p>

          <form
            onSubmit={handleSearch}
            role="search"
            className="mt-8 sm:mt-12 w-full bg-card text-card-foreground rounded-3xl sm:rounded-full shadow-xl p-2 flex flex-col sm:flex-row sm:items-stretch gap-1 sm:gap-0"
          >
            <DestinationField
              value={destination}
              text={destinationText}
              onTextChange={setDestinationText}
              onSelect={setDestination}
            />

            <div className="hidden sm:block w-px bg-border my-2" aria-hidden="true" />

            <MonthField value={month} onChange={setMonth} />

            <div className="hidden sm:block w-px bg-border my-2" aria-hidden="true" />

            <TravelersField
              adults={adults}
              childrenCount={childrenCount}
              onChange={(nextAdults, nextChildren) => {
                setAdults(nextAdults);
                setChildrenCount(nextChildren);
              }}
            />

            <Button
              type="submit"
              className="rounded-full h-11 sm:h-auto sm:px-7 font-semibold shrink-0 m-1"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 me-2" aria-hidden="true" />
              {t('common.search')}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
