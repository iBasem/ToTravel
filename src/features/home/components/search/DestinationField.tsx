import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { localizedText } from "@/lib/localized";
import { Popover, PopoverAnchor, PopoverContent } from "@/ui/popover";
import { useDestinationOptions } from "@/features/packages/hooks/useDestinations";
import type { DestinationRow } from "@/features/packages/hooks/useDestinations";

export interface DestinationSelection {
  slug: string;
  label: string;
}

interface DestinationFieldProps {
  /** Current selection (null while the user is typing free text). */
  value: DestinationSelection | null;
  /** Raw text shown in the input. */
  text: string;
  onTextChange: (text: string) => void;
  onSelect: (selection: DestinationSelection | null) => void;
}

const MAX_SUGGESTIONS = 8;

/** TourRadar-style default list: a continent followed by two countries, repeated. */
function mixSuggestions(destinations: DestinationRow[]) {
  const regions = destinations.filter((d) => d.kind === "region");
  const countries = destinations.filter((d) => d.kind === "country");
  const mixed: DestinationRow[] = [];
  let r = 0;
  let c = 0;
  while (mixed.length < MAX_SUGGESTIONS && (r < regions.length || c < countries.length)) {
    if (r < regions.length) mixed.push(regions[r++]);
    for (let i = 0; i < 2 && c < countries.length && mixed.length < MAX_SUGGESTIONS; i++) {
      mixed.push(countries[c++]);
    }
  }
  return mixed;
}

/**
 * "Where to?" combobox: type-ahead over the destinations catalog
 * (countries + continents). Selecting an option filters packages by
 * country; free text falls back to a plain text search. The list is
 * rendered through a portalled popover so the hero card's
 * overflow-hidden cannot clip it.
 */
export function DestinationField({ value, text, onTextChange, onSelect }: DestinationFieldProps) {
  const { t } = useTranslation();
  const { data: destinations = [] } = useDestinationOptions();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const anchorRef = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    // While a selection is active the input shows its label; treat that as "no query"
    const filtering = q !== "" && q !== value?.label.toLowerCase();
    if (!filtering) return mixSuggestions(destinations);
    const matches = destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.name_ar ?? "").toLowerCase().includes(q) ||
        d.slug.includes(q)
    );
    // Continents first, then countries, both in catalog display order
    const regions = matches.filter((d) => d.kind === "region");
    const countries = matches.filter((d) => d.kind === "country");
    return [...regions, ...countries].slice(0, MAX_SUGGESTIONS);
  }, [destinations, text, value]);

  const select = (row: DestinationRow) => {
    const label = localizedText(row, "name");
    onSelect({ slug: row.slug, label });
    onTextChange(label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      select(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <label
          ref={anchorRef}
          className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2.5 cursor-text"
        >
          <MapPin
            className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              onTextChange(e.target.value);
              onSelect(null);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("hero.whereTo")}
            aria-label={t("hero.whereTo")}
            role="combobox"
            aria-expanded={open}
            aria-controls="hero-destination-listbox"
            aria-autocomplete="list"
            className="w-full bg-transparent outline-none text-sm sm:text-base font-medium placeholder:text-muted-foreground"
          />
        </label>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="p-0 py-2 w-[var(--radix-popover-trigger-width)] min-w-[280px] max-h-96 overflow-y-auto rounded-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicking back into the input/anchor should not close the list
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <ul id="hero-destination-listbox" role="listbox" className="text-start">
          {suggestions.map((row, index) => (
            <li key={row.slug} role="option" aria-selected={value?.slug === row.slug}>
              <button
                type="button"
                onClick={() => select(row)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  index === activeIndex ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <span className="truncate">{localizedText(row, "name")}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {row.kind === "region" ? t("hero.continent") : t("hero.country")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
