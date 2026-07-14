import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Button } from "@/ui/button";

interface TravelersFieldProps {
  adults: number;
  childrenCount: number;
  onChange: (adults: number, childrenCount: number) => void;
}

const MAX_ADULTS = 12;
const MAX_CHILDREN = 8;

function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-full"
          disabled={value <= min}
          onClick={() => onValueChange(Math.max(min, value - 1))}
          aria-label={`${t("hero.decrease")} ${label}`}
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </Button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-full"
          disabled={value >= max}
          onClick={() => onValueChange(Math.min(max, value + 1))}
          aria-label={`${t("hero.increase")} ${label}`}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/**
 * "Who is travelling?" popover with adults/children steppers,
 * mirroring the TourRadar traveler picker.
 */
export function TravelersField({ adults, childrenCount, onChange }: TravelersFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Draft state so the trigger label only updates on Apply
  const [draftAdults, setDraftAdults] = useState(adults);
  const [draftChildren, setDraftChildren] = useState(childrenCount);

  const label = [
    t("hero.adultsCount", { count: adults }),
    ...(childrenCount > 0 ? [t("hero.childrenCount", { count: childrenCount })] : []),
  ].join(t("hero.listSeparator"));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftAdults(adults);
          setDraftChildren(childrenCount);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 px-4 py-2.5 border-t border-border sm:border-t-0 cursor-pointer text-start"
          aria-label={t("hero.travelers")}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base font-medium whitespace-nowrap">{label}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-5 rounded-2xl">
        <p className="text-base font-semibold mb-4">{t("hero.whoTravelling")}</p>

        <div className="space-y-4">
          <CounterRow
            label={t("hero.adults")}
            hint={t("hero.adultsHint")}
            value={draftAdults}
            min={1}
            max={MAX_ADULTS}
            onValueChange={setDraftAdults}
          />
          <CounterRow
            label={t("hero.children")}
            hint={t("hero.childrenHint")}
            value={draftChildren}
            min={0}
            max={MAX_CHILDREN}
            onValueChange={setDraftChildren}
          />
        </div>

        <div className="flex justify-end mt-5">
          <Button
            type="button"
            className="rounded-full px-6"
            onClick={() => {
              onChange(draftAdults, draftChildren);
              setOpen(false);
            }}
          >
            {t("hero.apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
