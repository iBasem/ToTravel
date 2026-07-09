import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { MapPin, Calendar, Search, Users } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1900&h=900&fit=crop";

/**
 * Marketplace hero: one large rounded image card aligned with the content
 * column, centered headline, and a pill-shaped search bar in the lower half
 * of the card that routes to the packages listing.
 */
export function HeroSection() {
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.set("search", searchLocation.trim());
    if (searchDate.trim()) params.set("when", searchDate.trim());
    if (travelers) params.set("travelers", travelers);
    navigate(`/packages${params.toString() ? `?${params.toString()}` : ""}`);
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
            <label className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2.5 cursor-text">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" aria-hidden="true" />
              <input
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder={t('hero.whereTo')}
                aria-label={t('hero.whereTo')}
                className="w-full bg-transparent outline-none text-sm sm:text-base font-medium placeholder:text-muted-foreground"
              />
            </label>

            <div className="hidden sm:block w-px bg-border my-2" aria-hidden="true" />

            <label className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2.5 border-t border-border sm:border-t-0 cursor-text">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" aria-hidden="true" />
              <input
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder={t('hero.when')}
                aria-label={t('hero.when')}
                className="w-full bg-transparent outline-none text-sm sm:text-base font-medium placeholder:text-muted-foreground"
              />
            </label>

            <div className="hidden sm:block w-px bg-border my-2" aria-hidden="true" />

            <label className="flex items-center gap-2.5 px-4 py-2.5 border-t border-border sm:border-t-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" aria-hidden="true" />
              <select
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                aria-label={t('hero.travelers')}
                className="bg-transparent outline-none text-sm sm:text-base font-medium cursor-pointer"
              >
                <option value="1">{t('hero.adults1')}</option>
                <option value="2">{t('hero.adults2')}</option>
                <option value="3">{t('hero.adults3')}</option>
                <option value="4">{t('hero.adults4')}</option>
              </select>
            </label>

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
