import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Button } from "@/ui/button";

interface MonthFieldProps {
  /** Selected departure month as "YYYY-MM", or null for any month. */
  value: string | null;
  onChange: (month: string | null) => void;
}

const YEARS_AHEAD = 2;

function formatMonthLabel(value: string, language: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

/**
 * "When?" field: TourRadar-style departure-month grid with year paging.
 * Past months are disabled; selection is a single "YYYY-MM" value.
 */
export function MonthField({ value, onChange }: MonthFieldProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based
  const [viewYear, setViewYear] = useState(value ? Number(value.split("-")[0]) : currentYear);

  const minYear = currentYear;
  const maxYear = currentYear + YEARS_AHEAD;

  const monthName = (monthIndex: number) =>
    new Intl.DateTimeFormat(i18n.language, { month: "short" }).format(
      new Date(viewYear, monthIndex, 1)
    );

  const selectMonth = (monthIndex: number) => {
    onChange(`${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2.5 border-t border-border sm:border-t-0 cursor-pointer text-start"
          aria-label={t("hero.when")}
        >
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <span
            className={`text-sm sm:text-base font-medium truncate ${
              value ? "" : "text-muted-foreground"
            }`}
          >
            {value ? formatMonthLabel(value, i18n.language) : t("hero.when")}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-5 rounded-2xl">
        <p className="text-base font-semibold mb-4">{t("hero.selectMonth")}</p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold">{viewYear}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={viewYear <= minYear}
              onClick={() => setViewYear((y) => Math.max(minYear, y - 1))}
              aria-label={t("hero.previousYear")}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={viewYear >= maxYear}
              onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              aria-label={t("hero.nextYear")}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const isPast = viewYear === currentYear && monthIndex < currentMonth;
            const monthValue = `${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`;
            const isSelected = value === monthValue;
            return (
              <button
                key={monthIndex}
                type="button"
                disabled={isPast}
                onClick={() => selectMonth(monthIndex)}
                className={`h-12 rounded-lg text-sm font-medium transition-colors border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : isPast
                      ? "bg-muted/50 text-muted-foreground/50 border-transparent cursor-not-allowed"
                      : "bg-muted/30 border-border hover:border-primary/60"
                }`}
              >
                {monthName(monthIndex)}
              </button>
            );
          })}
        </div>

        {value && (
          <Button
            type="button"
            variant="ghost"
            className="w-full mt-3 text-sm"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            {t("hero.anyMonth")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
