import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";

interface TourCarouselProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Optional slot rendered next to the arrows (e.g. a "View all" link) */
  headerAction?: ReactNode;
}

/**
 * Horizontal scroll-snap carousel used by the home sections (destinations,
 * deals, featured, recently added). RTL-aware: page arrows follow the reading
 * direction and the counter is based on absolute scroll offset, which Chrome
 * reports as negative in RTL.
 */
export function TourCarousel({ title, description, children, className = "", headerAction }: TourCarouselProps) {
  const { t, i18n } = useTranslation();
  const railRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const update = useCallback(() => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0) return;
    const total = Math.max(1, Math.ceil(rail.scrollWidth / rail.clientWidth));
    // Interpolate over the scrollable range so a partial last page still
    // registers as the final page (scrollLeft is negative in RTL).
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const progress = maxScroll > 0 ? Math.abs(rail.scrollLeft) / maxScroll : 0;
    const current = Math.min(total, Math.round(progress * (total - 1)) + 1);
    setPages(total);
    setPage(current);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, children]);

  const scrollByPage = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const rtl = i18n.dir() === "rtl";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: dir * (rtl ? -1 : 1) * rail.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{title}</h2>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerAction}
          {pages > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => scrollByPage(-1)}
                disabled={page === 1}
                aria-label={t("carousel.previous")}
              >
                <ChevronLeft className="w-4 h-4 rtl-flip" />
              </Button>
              <span
                className="text-sm font-medium text-muted-foreground min-w-10 text-center tabular-nums"
                aria-live="polite"
              >
                {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => scrollByPage(1)}
                disabled={page === pages}
                aria-label={t("carousel.next")}
              >
                <ChevronRight className="w-4 h-4 rtl-flip" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        ref={railRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 [&>*]:snap-start [&>*]:shrink-0"
      >
        {children}
      </div>
    </div>
  );
}
